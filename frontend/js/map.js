function areaKey(latitude, longitude) {
  return String(Math.round(latitude * 100) / 100) + "_" + String(Math.round(longitude * 100) / 100);
}

function formatDate(value) {
  if (!value) {
    return "Unknown";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function popupTemplate(crime) {
  return (
    '<div class="popup-card">' +
    "<h6>" + crime.title + "</h6>" +
    "<p><strong>Type:</strong> " + crime.crime_type + "</p>" +
    "<p><strong>Description:</strong> " + crime.description + "</p>" +
    "<p><strong>Time:</strong> " + formatDate(crime.created_at) + "</p>" +
    "</div>"
  );
}

function getRiskStyle(count) {
  if (count >= 10) {
    return { color: "#ef4444", glow: "#fecaca", label: "High", radius: 650 };
  }
  if (count >= 7) {
    return { color: "#f97316", glow: "#fed7aa", label: "Medium", radius: 560 };
  }
  return { color: "#facc15", glow: "#fef9c3", label: "Low", radius: 500 };
}

function addMapLegend(map) {
  const legend = L.control({ position: "bottomright" });
  legend.onAdd = function () {
    const div = L.DomUtil.create("div", "risk-legend");
    div.innerHTML =
      "<h6>Hotspot Intensity</h6>" +
      '<div><span class="dot dot-low"></span> Low (5-6)</div>' +
      '<div><span class="dot dot-medium"></span> Medium (7-9)</div>' +
      '<div><span class="dot dot-high"></span> High (10+)</div>' +
      '<div><span class="dot dot-predicted"></span> Predicted hotspot</div>';
    return div;
  };
  legend.addTo(map);
}

function drawRiskHotspot(layer, lat, lng, count) {
  const style = getRiskStyle(count);
  const center = [parseFloat(lat), parseFloat(lng)];

  L.circle(center, {
    color: style.color,
    weight: 1,
    fillColor: style.glow,
    fillOpacity: 0.25,
    radius: style.radius + 220
  }).addTo(layer);

  L.circle(center, {
    color: style.color,
    weight: 2,
    fillColor: style.color,
    fillOpacity: 0.22,
    radius: style.radius
  })
    .bindTooltip(style.label + " risk area (" + count + " crimes)", { className: "map-tooltip" })
    .addTo(layer);
}

function drawPredictedHotspot(layer, lat, lng) {
  const center = [parseFloat(lat), parseFloat(lng)];
  L.circle(center, {
    color: "#3b82f6",
    weight: 2,
    fillColor: "#93c5fd",
    fillOpacity: 0.18,
    radius: 720,
    dashArray: "6, 6"
  })
    .bindTooltip("Predicted hotspot", { className: "map-tooltip" })
    .addTo(layer);
}

async function initDashboard() {
  const map = L.map("map").setView([12.97, 77.59], 12);
  const filterEl = document.getElementById("crimeTypeFilter");
  let chartInstance = null;

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OpenStreetMap"
  }).addTo(map);
  addMapLegend(map);

  const markerLayer = L.markerClusterGroup ? L.markerClusterGroup() : L.layerGroup();
  const riskLayer = L.layerGroup();
  const predictionLayer = L.layerGroup();
  map.addLayer(markerLayer);
  map.addLayer(riskLayer);
  map.addLayer(predictionLayer);

  function drawChart(typeCount) {
    const chartEl = document.getElementById("crimeChart");
    if (!chartEl) {
      return;
    }
    if (chartInstance) {
      chartInstance.destroy();
    }
    if (Object.keys(typeCount).length === 0) {
      return;
    }
    chartInstance = new Chart(chartEl, {
      type: "bar",
      data: {
        labels: Object.keys(typeCount),
        datasets: [{ label: "Crime Count", data: Object.values(typeCount) }]
      }
    });
  }

  try {
    const crimes = await window.CrimeAPI.getCrimes();
    const alerts = await window.CrimeAPI.getAlerts();
    const predictions = await window.CrimeAPI.getPredictions();

    const areaCounts = {};
    crimes.forEach((crime) => {
      const key = areaKey(crime.latitude, crime.longitude);
      areaCounts[key] = (areaCounts[key] || 0) + 1;
    });

    const crimeTypes = Array.from(new Set(crimes.map((crime) => crime.crime_type).filter(Boolean))).sort();
    crimeTypes.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.innerText = type;
      filterEl.appendChild(option);
    });

    function renderFiltered() {
      const selectedType = filterEl.value;
      const filteredCrimes = selectedType === "all"
        ? crimes
        : crimes.filter((crime) => crime.crime_type === selectedType);

      markerLayer.clearLayers();
      riskLayer.clearLayers();
      predictionLayer.clearLayers();

      const typeCount = {};
      filteredCrimes.forEach((crime) => {
        const marker = L.marker([crime.latitude, crime.longitude]).bindPopup(popupTemplate(crime));
        markerLayer.addLayer(marker);
        typeCount[crime.crime_type] = (typeCount[crime.crime_type] || 0) + 1;
      });

      alerts.high_risk_areas.forEach((area) => {
        const [lat, lng] = area.split("_");
        const count = areaCounts[area] || 5;
        drawRiskHotspot(riskLayer, lat, lng, count);
      });

      predictions.predicted_hotspots.forEach((area) => {
        const [lat, lng] = area.split("_");
        drawPredictedHotspot(predictionLayer, lat, lng);
      });

      document.getElementById("totalCrimes").innerText = filteredCrimes.length;
      document.getElementById("riskAreas").innerText = alerts.high_risk_areas.length;
      drawChart(typeCount);
    }

    renderFiltered();
    filterEl.addEventListener("change", renderFiltered);

    if (alerts.high_risk_areas.length > 0) {
      const toast = document.getElementById("toast");
      toast.innerText = alerts.high_risk_areas.length + " High Risk Areas Detected";
      toast.style.display = "block";
      setTimeout(() => {
        toast.style.display = "none";
      }, 4000);
    }
  } catch (error) {
    console.error("Dashboard load error:", error);
  }
}

if (document.getElementById("map")) {
  initDashboard();
}
