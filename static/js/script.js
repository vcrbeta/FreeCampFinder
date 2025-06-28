// Make map a global variable or pass it to fetchCampingSpots
// so markers can be added to it.
let map; // Declare map globally so fetchCampingSpots can access it [15]

document.addEventListener("DOMContentLoaded", () => {
    // Check if #map exists before initializing map logic
    const mapContainer = document.getElementById("map");
    if (mapContainer) {
        initMap(); // Initialize map first so 'map' object is available
    }
    fetchCampingSpots(); // Then fetch camping spots and add them to the map
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

                    // --- NEW CODE: Add markers for camping spots ---
                    // Ensure map is initialized and spot has coordinates before adding marker
                    if (map && spot.latitude && spot.longitude) {
                        L.marker([spot.latitude, spot.longitude])
                            .addTo(map)
                            .bindPopup(`<b>${spot.name}</b><br>${spot.description || spot.location}`);
                    }
                    // --- END NEW CODE ---
                });
            }
        })
        .catch(err => {
            console.error("Error loading camping spots:", err);
        });
}

function initMap() {
    // Adjust view to Colorado where your data is filtered [15, 21]
    map = L.map("map").setView([39.5, -105.5], 7); 

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
                    // Use FORESTNAME property for USFS boundaries [22, 23]
                    const name = feature.properties?.FORESTNAME || "Unnamed Boundary"; 
                    layer.bindPopup(`<b>Forest:</b> ${name}`);
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
                    // Check console.log(feature.properties) to confirm road name property
                    const name = feature.properties && (feature.properties.NAME || feature.properties.Name) || "Unnamed Road";
                    layer.bindPopup(`<b>Road:</b> ${name}`);
                }
            }).addTo(map);
        })
        .catch(err => console.error("Error loading forest roads:", err));
}