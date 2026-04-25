function setReportMessage(message, isError) {
  const messageEl = document.getElementById("reportMessage");
  if (!messageEl) {
    return;
  }
  messageEl.innerText = message;
  messageEl.className = isError ? "alert alert-danger mt-3 mb-0 py-2" : "alert alert-success mt-3 mb-0 py-2";
}

function initLocationPickerMap() {
  const mapEl = document.getElementById("reportMap");
  if (!mapEl || typeof L === "undefined") {
    return null;
  }

  const reportMap = L.map("reportMap").setView([12.97, 77.59], 12);
  let selectedMarker = null;

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OpenStreetMap"
  }).addTo(reportMap);

  function setCoordinates(lat, lng) {
    document.getElementById("latitude").value = lat.toFixed(6);
    document.getElementById("longitude").value = lng.toFixed(6);
  }

  reportMap.on("click", function (event) {
    const lat = event.latlng.lat;
    const lng = event.latlng.lng;
    setCoordinates(lat, lng);

    if (selectedMarker) {
      reportMap.removeLayer(selectedMarker);
    }
    selectedMarker = L.marker([lat, lng]).addTo(reportMap).bindPopup("Selected location").openPopup();
  });

  return reportMap;
}

function getAppUser() {
  if (window.AppAuth) {
    return window.AppAuth.user;
  }
  return null;
}

function setReportAccessMessage(message, isError) {
  const box = document.getElementById("reportAccessMessage");
  if (!box) {
    return;
  }
  box.className = isError ? "alert alert-warning mb-3 py-2" : "alert alert-info mb-3 py-2";
  box.innerHTML = message;
}

function setFormEnabled(form, enabled) {
  Array.from(form.elements).forEach(function (element) {
    element.disabled = !enabled;
  });
}

function buildReportPayload() {
  return {
    title: document.getElementById("title").value.trim(),
    description: document.getElementById("description").value.trim(),
    crime_type: document.getElementById("crimeType").value.trim(),
    latitude: parseFloat(document.getElementById("latitude").value),
    longitude: parseFloat(document.getElementById("longitude").value)
  };
}

function validatePayload(payload) {
  if (!payload.title || !payload.description || !payload.crime_type) {
    return "Title, description, and crime type are required.";
  }
  if (Number.isNaN(payload.latitude) || Number.isNaN(payload.longitude)) {
    return "Valid latitude and longitude are required.";
  }
  return null;
}

async function handleReportSubmit(event) {
  event.preventDefault();
  const payload = buildReportPayload();
  const validationError = validatePayload(payload);
  if (validationError) {
    setReportMessage(validationError, true);
    return;
  }

  try {
    await window.CrimeAPI.submitCrime(payload);
    setReportMessage("Report submitted successfully.", false);
    event.target.reset();
  } catch (error) {
    setReportMessage(error.message || "Failed to submit report.", true);
  }
}

async function initReportPage() {
  const form = document.getElementById("reportForm");
  if (!form) {
    return;
  }

  if (window.AppAuthReady) {
    await window.AppAuthReady;
  }

  const user = getAppUser();
  if (!user) {
    setFormEnabled(form, false);
    setReportAccessMessage(
      'Please <a href="login.html?next=report.html">login</a> to submit a report.',
      true
    );
    return;
  }

  setReportAccessMessage("You are logged in and can submit reports.", false);
  setFormEnabled(form, true);
  initLocationPickerMap();
  form.addEventListener("submit", handleReportSubmit);
}

initReportPage();
