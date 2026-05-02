function setRejectedMessage(message, isError) {
  const el = document.getElementById("rejectedMessage");
  if (!el) {
    return;
  }
  el.innerText = message || "";
  el.className = message ? (isError ? "alert alert-danger mb-3 py-2" : "alert alert-info mb-3 py-2") : "mb-3";
}

function formatDate(value) {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function escapeCell(text) {
  if (text === null || text === undefined) {
    return "—";
  }
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}

function renderRejectedRows(reports) {
  const body = document.getElementById("rejectedListBody");
  const countEl = document.getElementById("rejectedCount");
  if (!body) {
    return;
  }
  if (countEl) {
    countEl.innerText = String(reports.length) + " total";
  }
  if (!reports.length) {
    body.innerHTML =
      '<tr><td colspan="7" class="text-center text-secondary">No rejected cases yet.</td></tr>';
    return;
  }
  body.innerHTML = reports
    .map(function (r) {
      const lat = Number(r.latitude).toFixed(4);
      const lng = Number(r.longitude).toFixed(4);
      const reporter = r.reported_by != null ? String(r.reported_by) : "—";
      return (
        "<tr>" +
        "<td>" +
        escapeCell(r.id) +
        "</td>" +
        "<td>" +
        escapeCell(r.title) +
        "</td>" +
        "<td>" +
        escapeCell(r.crime_type) +
        "</td>" +
        "<td>" +
        escapeCell(r.description) +
        "</td>" +
        "<td>" +
        lat +
        ", " +
        lng +
        "</td>" +
        "<td>" +
        escapeCell(reporter) +
        "</td>" +
        "<td>" +
        escapeCell(formatDate(r.created_at)) +
        "</td>" +
        "</tr>"
      );
    })
    .join("");
}

async function initRejectedPage() {
  if (window.AppAuthReady) {
    await window.AppAuthReady;
  }

  const user = window.AppAuth ? window.AppAuth.user : null;
  if (!user) {
    window.location.href = "login.html?next=rejected.html&error=Please%20login";
    return;
  }
  if (!user.is_admin) {
    setRejectedMessage("Administrator privileges are required to view rejected cases.", true);
    const body = document.getElementById("rejectedListBody");
    if (body) {
      body.innerHTML =
        '<tr><td colspan="7" class="text-center text-secondary">No access.</td></tr>';
    }
    return;
  }

  setRejectedMessage("", false);

  try {
    const reports = await window.CrimeAPI.getRejectedReports();
    renderRejectedRows(Array.isArray(reports) ? reports : []);
  } catch (error) {
    setRejectedMessage(error.message || "Failed to load rejected cases.", true);
    const body = document.getElementById("rejectedListBody");
    if (body) {
      body.innerHTML =
        '<tr><td colspan="7" class="text-center text-secondary">Could not load data.</td></tr>';
    }
  }
}

initRejectedPage();
