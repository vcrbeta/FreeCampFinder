document.addEventListener("DOMContentLoaded", () => {
  fetchCampingSpots();

  // Only run map logic if there's a #map element on the page
  const mapContainer = document.getElementById("map");
  if (mapContainer) {
    initMap();
  }
});

function fetchCampingSpots() {
  fetch("/api/camping_spots")
    .then(response => response.json())
    .then(data => {
      const list = document.getElementById("camping-list");
      if (list) {
        list.innerHTML = "";
        data.forEach(spot => {
          const li = document.createElement("li");
          li.textContent = `${spot.name} — Location: ${spot.location}`;
          list.appendChild(li);
        });
      }
    })
    .catch(err => {
      console.error("Error loading camping spots:", err);
    });
}

function initMap() {
  const map = L.map("map").setView([39.5, -98.35], 4); // Center of the U.S.

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  // Load forest boundaries with popups
  fetch("/api/forest_boundaries")
    .then(res => res.json())
    .then(data => {
      L.geoJSON(data, {
        style: { color: "green", weight: 2, fillOpacity: 0.1 },
        onEachFeature: function(feature, layer) {
          const name = feature.properties && (feature.properties.Name || feature.properties.NAME) || "Unnamed Boundary";
          layer.bindPopup(`<strong>Boundary:</strong> ${name}`);
        }
      }).addTo(map);
    })
    .catch(err => console.error("Error loading forest boundaries:", err));

  // Load forest roads with popups
  fetch("/api/forest_roads")
    .then(res => res.json())
    .then(data => {
      L.geoJSON(data, {
        style: { color: "gray", weight: 1 },
        onEachFeature: function(feature, layer) {
          const name = feature.properties && (feature.properties.Name || feature.properties.NAME) || "Unnamed Road";
          layer.bindPopup(`<strong>Road:</strong> ${name}`);
        }
      }).addTo(map);
    })
    .catch(err => console.error("Error loading forest roads:", err));
}
