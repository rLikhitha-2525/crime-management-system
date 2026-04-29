function setAdminMessage(message, isError) {
  const messageEl = document.getElementById("adminMessage");
  if (!messageEl) {
    return;
  }
  messageEl.innerText = message;
  messageEl.className = isError ? "alert alert-danger mb-3 py-2" : "alert alert-success mb-3 py-2";
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

async function requireAdminUser() {
  const user = window.AppAuth ? window.AppAuth.user : null;
  if (!user) {
    window.location.href = "login.html?next=admin.html&error=Please%20login%20as%20an%20admin";
    return null;
  }
  if (!user.is_admin) {
    setAdminMessage("Admin access required to moderate reports.", true);
    return null;
  }
  return user;
}

function createActionButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.innerText = label;
  button.addEventListener("click", onClick);
  return button;
}

function initReportPreviewMap(mapElement, latitude, longitude) {
  if (!mapElement || typeof L === "undefined") {
    return;
  }

  const map = L.map(mapElement, {
    zoomControl: false,
    attributionControl: false
  }).setView([latitude, longitude], 14);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
  L.marker([latitude, longitude]).addTo(map).bindPopup("Reported location");

  setTimeout(function () {
    map.invalidateSize();
  }, 0);
}

function createPendingReportCard(report) {
  const column = document.createElement("div");
  column.className = "col-12";

  const card = document.createElement("div");
  card.className = "card form-card p-3";

  const header = document.createElement("div");
  header.className = "d-flex justify-content-between align-items-start gap-2 mb-2";

  const title = document.createElement("h5");
  title.className = "mb-0";
  title.innerText = report.title;

  const statusBadge = document.createElement("span");
  statusBadge.className = "badge text-bg-warning";
  statusBadge.innerText = "Pending review";

  const description = document.createElement("p");
  description.className = "mb-2";
  description.innerText = report.description || "No description provided.";

  const meta = document.createElement("p");
  meta.className = "mb-3";
  meta.innerHTML =
    "<strong>Type:</strong> " +
    report.crime_type +
    " | <strong>Time:</strong> " +
    formatDate(report.created_at);

  const location = document.createElement("p");
  location.className = "mb-3";
  location.innerHTML =
    "<strong>Location:</strong> " +
    report.latitude +
    ", " +
    report.longitude +
    ' <a href="https://www.google.com/maps?q=' +
    report.latitude +
    "," +
    report.longitude +
    '" target="_blank" rel="noopener noreferrer">View on Map</a>';

  const inlineMap = document.createElement("div");
  inlineMap.className = "admin-report-map";

  const actions = document.createElement("div");
  actions.className = "d-flex gap-2 mt-2 flex-wrap";

  const approveBtn = createActionButton("Approve", "btn btn-success btn-sm px-3", async function () {
    await window.CrimeAPI.approveReport(report.id);
    setAdminMessage("Report approved. The reporter was notified.", false);
    await refreshPendingReports();
  });

  const rejectBtn = createActionButton("Reject", "btn btn-danger btn-sm px-3", async function () {
    await window.CrimeAPI.rejectReport(report.id);
    setAdminMessage("Report rejected. The reporter was notified.", false);
    await refreshPendingReports();
  });

  header.appendChild(title);
  header.appendChild(statusBadge);
  actions.appendChild(approveBtn);
  actions.appendChild(rejectBtn);
  card.appendChild(header);
  card.appendChild(description);
  card.appendChild(meta);
  card.appendChild(location);
  card.appendChild(inlineMap);
  card.appendChild(actions);
  column.appendChild(card);

  return { column: column, mapElement: inlineMap };
}

function createActiveReportCard(report) {
  const column = document.createElement("div");
  column.className = "col-12";

  const card = document.createElement("div");
  card.className = "card form-card p-3 border border-success border-opacity-25";

  const header = document.createElement("div");
  header.className = "d-flex justify-content-between align-items-start gap-2 mb-2";

  const title = document.createElement("h5");
  title.className = "mb-0";
  title.innerText = report.title;

  const statusBadge = document.createElement("span");
  statusBadge.className = "badge text-bg-success";
  statusBadge.innerText = "Active on map";

  const description = document.createElement("p");
  description.className = "mb-2";
  description.innerText = report.description || "No description provided.";

  const meta = document.createElement("p");
  meta.className = "mb-3";
  meta.innerHTML =
    "<strong>Type:</strong> " +
    report.crime_type +
    " | <strong>Time:</strong> " +
    formatDate(report.created_at);

  const location = document.createElement("p");
  location.className = "mb-3";
  location.innerHTML =
    "<strong>Location:</strong> " +
    report.latitude +
    ", " +
    report.longitude +
    ' <a href="https://www.google.com/maps?q=' +
    report.latitude +
    "," +
    report.longitude +
    '" target="_blank" rel="noopener noreferrer">View on Map</a>';

  const inlineMap = document.createElement("div");
  inlineMap.className = "admin-report-map";

  const hint = document.createElement("p");
  hint.className = "small text-secondary mb-2";
  hint.innerText =
    "Resolve when the case is closed. It disappears from the public map but still counts toward hotspot prediction.";

  const actions = document.createElement("div");
  actions.className = "d-flex gap-2 mt-2";

  const resolveBtn = createActionButton("Mark resolved", "btn btn-primary btn-sm px-3", async function () {
    await window.CrimeAPI.resolveReport(report.id);
    setAdminMessage("Case marked resolved. The reporter was notified.", false);
    await refreshActiveReports();
  });

  header.appendChild(title);
  header.appendChild(statusBadge);
  actions.appendChild(resolveBtn);
  card.appendChild(header);
  card.appendChild(description);
  card.appendChild(meta);
  card.appendChild(location);
  card.appendChild(hint);
  card.appendChild(inlineMap);
  card.appendChild(actions);
  column.appendChild(card);

  return { column: column, mapElement: inlineMap };
}

async function refreshPendingReports() {
  const container = document.getElementById("pendingReports");
  if (!container) {
    return;
  }

  const wasOnPendingTab = document
    .getElementById("tab-pending-btn")
    ?.classList.contains("active");

  container.innerHTML = "";

  try {
    const reports = await window.CrimeAPI.getPendingReports();

    if (!reports.length) {
      const empty = document.createElement("div");
      empty.className = "col-12";
      empty.innerHTML = '<div class="card form-card p-3">No pending reports.</div>';
      container.appendChild(empty);
      return;
    }

    reports.forEach(function (report) {
      const cardData = createPendingReportCard(report);
      container.appendChild(cardData.column);
      initReportPreviewMap(cardData.mapElement, report.latitude, report.longitude);
    });
  } catch (error) {
    setAdminMessage(error.message || "Failed to load pending reports.", true);
  } finally {
    if (wasOnPendingTab) {
      restoreAdminTabIfNeeded("pending");
    }
  }
}

function restoreAdminTabIfNeeded(which) {
  if (which !== "active" && which !== "pending") {
    return;
  }
  if (!window.bootstrap || !window.bootstrap.Tab) {
    return;
  }
  const btnId = which === "active" ? "tab-active-btn" : "tab-pending-btn";
  const btn = document.getElementById(btnId);
  if (!btn) {
    return;
  }
  window.bootstrap.Tab.getOrCreateInstance(btn).show();
}

async function refreshActiveReports() {
  const container = document.getElementById("activeReports");
  if (!container) {
    return;
  }

  const wasOnActiveTab = document
    .getElementById("tab-active-btn")
    ?.classList.contains("active");

  container.innerHTML = "";

  try {
    const reports = await window.CrimeAPI.getActiveReports();

    if (!reports.length) {
      const empty = document.createElement("div");
      empty.className = "col-12";
      empty.innerHTML =
        '<div class="card form-card p-3">No active cases on the map. Approve pending reports or all cases are resolved.</div>';
      container.appendChild(empty);
      return;
    }

    reports.forEach(function (report) {
      const cardData = createActiveReportCard(report);
      container.appendChild(cardData.column);
      initReportPreviewMap(cardData.mapElement, report.latitude, report.longitude);
    });
  } catch (error) {
    setAdminMessage(error.message || "Failed to load active cases.", true);
  } finally {
    if (wasOnActiveTab) {
      restoreAdminTabIfNeeded("active");
    }
  }
}

async function initAdminPage() {
  if (window.AppAuthReady) {
    await window.AppAuthReady;
  }

  const user = await requireAdminUser();
  if (!user) {
    const pending = document.getElementById("pendingReports");
    const active = document.getElementById("activeReports");
    const msg =
      '<div class="col-12"><div class="card form-card p-3">You do not have permission to view moderation actions.</div></div>';
    if (pending) {
      pending.innerHTML = msg;
    }
    if (active) {
      active.innerHTML = msg;
    }
    return;
  }
  setAdminMessage("Logged in as admin: " + user.username, false);
  await refreshPendingReports();
  await refreshActiveReports();

  const activeTabBtn = document.getElementById("tab-active-btn");
  if (activeTabBtn) {
    activeTabBtn.addEventListener("shown.bs.tab", function () {
      refreshActiveReports();
    });
  }
}

initAdminPage();
