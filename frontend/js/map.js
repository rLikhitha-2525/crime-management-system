function areaKey(latitude, longitude) {
  return (
    String(Math.round(latitude * 100) / 100) +
    "_" +
    String(Math.round(longitude * 100) / 100)
  );
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
    "<h6>" +
    crime.title +
    "</h6>" +
    "<p><strong>Type:</strong> " +
    crime.crime_type +
    "</p>" +
    "<p><strong>Description:</strong> " +
    crime.description +
    "</p>" +
    "<p><strong>Time:</strong> " +
    formatDate(crime.created_at) +
    "</p>" +
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
    radius: style.radius + 220,
  }).addTo(layer);

  L.circle(center, {
    color: style.color,
    weight: 2,
    fillColor: style.color,
    fillOpacity: 0.22,
    radius: style.radius,
  })
    .bindTooltip(style.label + " risk area (" + count + " crimes)", {
      className: "map-tooltip",
    })
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
    dashArray: "6, 6",
  })
    .bindTooltip("Predicted hotspot", { className: "map-tooltip" })
    .addTo(layer);
}

async function initDashboard() {
  const map = L.map("map").setView([12.97, 77.59], 12);
  const filterEl = document.getElementById("crimeTypeFilter");
  const highAlertBtn = document.getElementById("showHighAlertBtn");
  const crimeListBody = document.getElementById("crimeListBody");
  const toast = document.getElementById("toast");
  let chartInstance = null;

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OpenStreetMap",
  }).addTo(map);
  addMapLegend(map);

  const markerLayer = L.markerClusterGroup
    ? L.markerClusterGroup()
    : L.layerGroup();
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
        datasets: [{ label: "Crime Count", data: Object.values(typeCount) }],
      },
    });
  }

  function renderCrimeList(rows) {
    if (!crimeListBody) {
      return;
    }
    if (!rows.length) {
      crimeListBody.innerHTML =
        '<tr><td colspan="6" class="text-center text-secondary">No crimes found.</td></tr>';
      return;
    }

    crimeListBody.innerHTML = rows
      .map((crime) => {
        const lat = Number(crime.latitude).toFixed(4);
        const lng = Number(crime.longitude).toFixed(4);
        const statusText =
          crime.case_status === "approved"
            ? "Active (on map)"
            : crime.case_status || "—";
        return (
          "<tr>" +
          "<td>" +
          (crime.title || "-") +
          "</td>" +
          "<td>" +
          (crime.crime_type || "-") +
          "</td>" +
          "<td>" +
          (crime.description || "-") +
          "</td>" +
          "<td>" +
          lat +
          ", " +
          lng +
          "</td>" +
          "<td>" +
          statusText +
          "</td>" +
          "<td>" +
          formatDate(crime.created_at) +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  try {
    const crimes = await window.CrimeAPI.getCrimes();
    const alerts = await window.CrimeAPI.getAlerts();
    const predictions = await window.CrimeAPI.getPredictions();
    const zones = alerts.zones || [];

    const crimeTypes = Array.from(
      new Set(crimes.map((crime) => crime.crime_type).filter(Boolean)),
    ).sort();
    crimeTypes.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.innerText = type;
      filterEl.appendChild(option);
    });

    function renderFiltered() {
      const selectedType = filterEl.value;
      const filteredCrimes =
        selectedType === "all"
          ? crimes
          : crimes.filter((crime) => crime.crime_type === selectedType);

      markerLayer.clearLayers();
      riskLayer.clearLayers();
      predictionLayer.clearLayers();

      const typeCount = {};
      filteredCrimes.forEach((crime) => {
        const marker = L.marker([crime.latitude, crime.longitude]).bindPopup(
          popupTemplate(crime),
        );
        markerLayer.addLayer(marker);
        typeCount[crime.crime_type] = (typeCount[crime.crime_type] || 0) + 1;
      });

      zones.forEach((z) => {
        let color;

        if (z.level === "high") color = "red";
        else if (z.level === "medium") color = "orange";
        else if (z.level === "low") color = "yellow";

        L.circle([z.lat, z.lng], {
          color,
          fillColor: color,
          fillOpacity: 0.4,
          radius: 600,
        }).addTo(riskLayer);
      });

      predictions.predicted_hotspots.forEach((p) => {
        if (typeof p === "string") {
          const parts = p.split("_");
          drawPredictedHotspot(predictionLayer, parts[0], parts[1]);
        } else if (p && p.lat != null && p.lng != null) {
          drawPredictedHotspot(predictionLayer, p.lat, p.lng);
        }
      });

      document.getElementById("totalCrimes").innerText = filteredCrimes.length;
      document.getElementById("riskAreas").innerText = zones.filter(
        (z) => z.level === "high",
      ).length;
      drawChart(typeCount);
      renderCrimeList(filteredCrimes);
    }

    function triggerHighAlert() {
      const highZones = zones.filter((z) => z.level === "high");
      if (!highZones.length) {
        toast.innerText = "No high risk areas right now";
        toast.style.display = "block";
        setTimeout(() => {
          toast.style.display = "none";
        }, 2500);
        return;
      }

      const primaryArea = highZones[0];
      const lat = parseFloat(primaryArea.lat);
      const lng = parseFloat(primaryArea.lng);
      map.flyTo([lat, lng], 14, { duration: 1.2 });

      toast.innerText = highZones.length + " High Risk Areas Detected";
      toast.style.display = "block";
      setTimeout(() => {
        toast.style.display = "none";
      }, 4000);
    }

    renderFiltered();
    filterEl.addEventListener("change", renderFiltered);
    if (highAlertBtn) {
      highAlertBtn.addEventListener("click", triggerHighAlert);
    }

    if (zones.some((z) => z.level === "high")) {
      triggerHighAlert();
    }
  } catch (error) {
    console.error("Dashboard load error:", error);
  }
}

if (document.getElementById("map")) {
  initDashboard();
}
