let map;
let forestBoundariesLayer;
let forestRoadsLayer;
let campingSpotsLayer;

function initMap() {
    console.log("Initializing map...");
    map = L.map('map').setView([39.8283, -98.5795], 4);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Initialize layer groups
    forestBoundariesLayer = L.layerGroup().addTo(map);
    forestRoadsLayer = L.layerGroup();
    campingSpotsLayer = L.layerGroup().addTo(map);

    // Load initial data
    loadCampingSpots();
    loadForestBoundaries();
    
    // Add legend
    addMapLegend(map);
    
    // Add layer control
    const overlayMaps = {
        "Forest Boundaries": forestBoundariesLayer,
        "Forest Roads": forestRoadsLayer,
        "Camping Spots": campingSpotsLayer
    };
    
    L.control.layers(null, overlayMaps).addTo(map);
    
    // Add click handler for adding new camping spots
    map.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        // Check if user is logged in (you might want to check session on backend)
        const name = prompt("Enter camping spot name:");
        const location = prompt("Enter location description:");
        const description = prompt("Enter description (optional):");
        const state = prompt("Enter state (2-letter code):");
        
        if (name && location && state) {
            addCampingSpot(name, location, description, state, lat, lng);
        }
    });
}

function addMapLegend(map) {
    const legend = L.control({ position: "bottomright" });

    legend.onAdd = function () {
        const div = L.DomUtil.create("div", "info legend");
        div.innerHTML += "<h4>Map Legend</h4>";
        div.innerHTML +=
            '<i style="background: #228B22; width: 18px; height: 18px; display: inline-block; margin-right: 5px; border: 1px solid #000;"></i> Forest Boundaries<br>';
        div.innerHTML +=
            '<i style="background: #8B4513; width: 18px; height: 18px; display: inline-block; margin-right: 5px; border: 1px solid #000;"></i> Forest Roads<br>';
        div.innerHTML +=
            '<img src="https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png" alt="Pin" style="vertical-align:middle; margin-right:5px; width: 20px; height: 30px;"> Camping Spots<br>';
        div.innerHTML +=
            '<small style="color: #666; font-style: italic;">Click map to add new camping spots</small>';
        return div;
    };

    legend.addTo(map);
}

function loadCampingSpots(state = null) {
    console.log("Loading camping spots...");
    let url = '/api/camping_spots';
    if (state) {
        url += `?state=${state}`;
    }
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log("Received camping spots:", data);
            campingSpotsLayer.clearLayers();
            
            data.forEach(spot => {
                if (spot.latitude && spot.longitude) {
                    const marker = L.marker([spot.latitude, spot.longitude])
                        .bindPopup(`
                            <strong>${spot.name}</strong><br>
                            <em>${spot.location}</em><br>
                            ${spot.description || ''}<br>
                            <small>State: ${spot.state}</small>
                        `);
                    campingSpotsLayer.addLayer(marker);
                }
            });
        })
        .catch(error => {
            console.error('Error loading camping spots:', error);
        });
}

function loadForestBoundaries() {
    console.log("Loading forest boundaries...");
    fetch('/api/forest_boundaries')
        .then(response => response.json())
        .then(data => {
            console.log("Received forest boundaries:", data);
            forestBoundariesLayer.clearLayers();
            
            if (data.features) {
                L.geoJSON(data, {
                    style: {
                        color: '#228B22',
                        weight: 2,
                        fillColor: '#228B22',
                        fillOpacity: 0.1
                    },
                    onEachFeature: function (feature, layer) {
                        if (feature.properties && feature.properties.FORESTNAME) {
                            layer.bindPopup(`<strong>${feature.properties.FORESTNAME}</strong>`);
                        }
                    }
                }).addTo(forestBoundariesLayer);
            }
        })
        .catch(error => {
            console.error('Error loading forest boundaries:', error);
        });
}

function loadForestRoads() {
    console.log("Loading forest roads...");
    fetch('/api/forest_roads')
        .then(response => response.json())
        .then(data => {
            console.log("Received forest roads:", data);
            forestRoadsLayer.clearLayers();
            
            if (data.features) {
                L.geoJSON(data, {
                    style: {
                        color: '#8B4513',
                        weight: 2,
                        opacity: 0.7
                    },
                    onEachFeature: function (feature, layer) {
                        if (feature.properties && feature.properties.ROADNAME) {
                            layer.bindPopup(`<strong>Road:</strong> ${feature.properties.ROADNAME}`);
                        }
                    }
                }).addTo(forestRoadsLayer);
            }
        })
        .catch(error => {
            console.error('Error loading forest roads:', error);
        });
}

function addCampingSpot(name, location, description, state, latitude, longitude) {
    console.log("Adding camping spot:", name, location, description, state, latitude, longitude);
    
    const spotData = {
        name: name,
        location: location,
        description: description,
        state: state,
        latitude: latitude,
        longitude: longitude
    };
    
    fetch('/api/camping_spots', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(spotData)
    })
    .then(response => response.json())
    .then(data => {
        console.log("Response from server:", data);
        if (data.success) {
            // Add marker to map immediately
            const marker = L.marker([latitude, longitude])
                .bindPopup(`
                    <strong>${name}</strong><br>
                    <em>${location}</em><br>
                    ${description || ''}<br>
                    <small>State: ${state}</small>
                `);
            campingSpotsLayer.addLayer(marker);
            
            alert("Camping spot added successfully!");
        } else {
            alert("Error adding camping spot: " + (data.error || "Unknown error"));
        }
    })
    .catch(error => {
        console.error('Error adding camping spot:', error);
        alert("Error adding camping spot. Please try again.");
    });
}

function filterByState() {
    const stateSelect = document.getElementById('stateFilter');
    const selectedState = stateSelect.value;
    
    if (selectedState === 'all') {
        loadCampingSpots();
    } else {
        loadCampingSpots(selectedState);
    }
}

// Initialize map when page loads
document.addEventListener('DOMContentLoaded', function() {
    initMap();
});