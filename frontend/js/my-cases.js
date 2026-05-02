function setMyCasesMessage(message, isError) {
  const el = document.getElementById("myCasesMessage");
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

function statusDisplay(caseStatus) {
  const s = (caseStatus || "").toLowerCase();
  const labels = {
    pending: "Pending review",
    approved: "Approved (on map)",
    resolved: "Resolved",
    rejected: "Rejected"
  };
  const badges = {
    pending: "text-bg-warning",
    approved: "text-bg-success",
    resolved: "text-bg-secondary",
    rejected: "text-bg-danger"
  };
  const label = labels[s] || caseStatus || "—";
  const badgeClass = badges[s] || "text-bg-secondary";
  return { label: label, badgeClass: badgeClass };
}

function renderMyCasesRows(reports) {
  const body = document.getElementById("myCasesListBody");
  const countEl = document.getElementById("myCasesCount");
  if (!body) {
    return;
  }
  if (countEl) {
    countEl.innerText = String(reports.length) + " total";
  }
  if (!reports.length) {
    body.innerHTML =
      '<tr><td colspan="7" class="text-center text-secondary">You have not submitted any reports yet. <a href="report.html" class="link-light">Report a crime</a></td></tr>';
    return;
  }
  body.innerHTML = reports
    .map(function (r) {
      const lat = Number(r.latitude).toFixed(4);
      const lng = Number(r.longitude).toFixed(4);
      const st = statusDisplay(r.case_status);
      return (
        "<tr>" +
        "<td>" +
        escapeCell(r.id) +
        "</td>" +
        "<td><span class=\"badge " +
        st.badgeClass +
        "\">" +
        escapeCell(st.label) +
        "</span></td>" +
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
        escapeCell(formatDate(r.created_at)) +
        "</td>" +
        "</tr>"
      );
    })
    .join("");
}

async function initMyCasesPage() {
  if (window.AppAuthReady) {
    await window.AppAuthReady;
  }

  const user = window.AppAuth ? window.AppAuth.user : null;
  if (!user) {
    window.location.href = "login.html?next=my-cases.html&error=Please%20login%20to%20view%20your%20cases";
    return;
  }

  setMyCasesMessage("", false);

  try {
    const reports = await window.CrimeAPI.getMyReports();
    renderMyCasesRows(Array.isArray(reports) ? reports : []);
  } catch (error) {
    setMyCasesMessage(error.message || "Failed to load your cases.", true);
    const body = document.getElementById("myCasesListBody");
    if (body) {
      body.innerHTML =
        '<tr><td colspan="7" class="text-center text-secondary">Could not load data.</td></tr>';
    }
  }
}

initMyCasesPage();
