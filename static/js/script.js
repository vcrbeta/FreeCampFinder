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
    
    // Modified click handler - only prompts when click-to-add mode is enabled
    map.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        // Check if click-to-add mode is enabled
        if (typeof window.clickToAddMode === 'function' && window.clickToAddMode()) {
            // Call the function to handle map click (fills form)
            if (typeof window.handleMapClick === 'function') {
                window.handleMapClick(lat, lng);
            }
        }
        // If click-to-add mode is disabled, do nothing (allows free exploration)
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
            '<small style="color: #666; font-style: italic;">Use the form below to add camping spots<br>or enable "Click-to-Add" mode</small>';
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
                            <div style="max-width: 200px;">
                                <strong style="color: #2a6f97; font-size: 1.1em;">${spot.name}</strong><br>
                                <em style="color: #666;">${spot.location}</em><br>
                                ${spot.description ? `<p style="margin: 0.5rem 0; font-size: 0.9em;">${spot.description}</p>` : ''}<br>
                                <small style="background: #e8f5e8; padding: 2px 6px; border-radius: 3px; color: #2a6f97;"><strong>State: ${spot.state}</strong></small>
                            </div>
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
                    <div style="max-width: 200px;">
                        <strong style="color: #2a6f97; font-size: 1.1em;">${name}</strong><br>
                        <em style="color: #666;">${location}</em><br>
                        ${description ? `<p style="margin: 0.5rem 0; font-size: 0.9em;">${description}</p>` : ''}<br>
                        <small style="background: #e8f5e8; padding: 2px 6px; border-radius: 3px; color: #2a6f97;"><strong>State: ${state}</strong></small>
                    </div>
                `);
            campingSpotsLayer.addLayer(marker);
            
            // Center map on new marker
            map.setView([latitude, longitude], Math.max(map.getZoom(), 10));
            
            // Open the popup
            marker.openPopup();
            
            alert("Camping spot added successfully! 🏕️");
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
    
    // State boundaries for zooming (center coordinates and zoom levels)
    const stateBounds = {
        // Western States
        'AK': { lat: 64.0, lng: -153.0, zoom: 4 },    // Alaska
        'AZ': { lat: 34.0, lng: -111.0, zoom: 7 },    // Arizona
        'CA': { lat: 36.7, lng: -119.7, zoom: 6 },    // California
        'CO': { lat: 39.0, lng: -105.5, zoom: 7 },    // Colorado
        'ID': { lat: 44.0, lng: -114.0, zoom: 6 },    // Idaho
        'MT': { lat: 47.0, lng: -110.0, zoom: 6 },    // Montana
        'NV': { lat: 38.5, lng: -116.9, zoom: 7 },    // Nevada
        'NM': { lat: 34.5, lng: -106.0, zoom: 7 },    // New Mexico
        'OR': { lat: 44.0, lng: -120.5, zoom: 7 },    // Oregon
        'UT': { lat: 39.3, lng: -111.6, zoom: 7 },    // Utah
        'WA': { lat: 47.2, lng: -120.7, zoom: 7 },    // Washington
        'WY': { lat: 43.0, lng: -107.5, zoom: 7 },    // Wyoming
        
        // Midwest States
        'IA': { lat: 42.0, lng: -93.5, zoom: 7 },     // Iowa
        'IL': { lat: 40.0, lng: -89.0, zoom: 7 },     // Illinois
        'IN': { lat: 39.8, lng: -86.1, zoom: 7 },     // Indiana
        'KS': { lat: 38.5, lng: -98.0, zoom: 7 },     // Kansas
        'MI': { lat: 44.3, lng: -85.6, zoom: 6 },     // Michigan
        'MN': { lat: 45.7, lng: -93.9, zoom: 6 },     // Minnesota
        'MO': { lat: 38.4, lng: -92.6, zoom: 7 },     // Missouri
        'ND': { lat: 47.5, lng: -99.8, zoom: 7 },     // North Dakota
        'NE': { lat: 41.1, lng: -98.0, zoom: 7 },     // Nebraska
        'OH': { lat: 40.4, lng: -82.7, zoom: 7 },     // Ohio
        'SD': { lat: 44.3, lng: -99.9, zoom: 7 },     // South Dakota
        'WI': { lat: 44.3, lng: -89.6, zoom: 7 },     // Wisconsin
        
        // Southern States
        'AL': { lat: 32.8, lng: -86.8, zoom: 7 },     // Alabama
        'AR': { lat: 34.9, lng: -92.4, zoom: 7 },     // Arkansas
        'FL': { lat: 27.8, lng: -81.7, zoom: 6 },     // Florida
        'GA': { lat: 33.0, lng: -83.5, zoom: 7 },     // Georgia
        'KY': { lat: 37.7, lng: -84.9, zoom: 7 },     // Kentucky
        'LA': { lat: 31.1, lng: -91.8, zoom: 7 },     // Louisiana
        'MS': { lat: 32.7, lng: -89.7, zoom: 7 },     // Mississippi
        'NC': { lat: 35.5, lng: -79.8, zoom: 7 },     // North Carolina
        'OK': { lat: 35.5, lng: -96.9, zoom: 7 },     // Oklahoma
        'SC': { lat: 33.8, lng: -80.9, zoom: 7 },     // South Carolina
        'TN': { lat: 35.7, lng: -86.7, zoom: 7 },     // Tennessee
        'TX': { lat: 31.0, lng: -97.5, zoom: 6 },     // Texas
        'VA': { lat: 37.8, lng: -78.2, zoom: 7 },     // Virginia
        'WV': { lat: 38.5, lng: -80.9, zoom: 7 },     // West Virginia
        
        // Northeast States
        'CT': { lat: 41.6, lng: -72.7, zoom: 8 },     // Connecticut
        'DE': { lat: 39.3, lng: -75.5, zoom: 8 },     // Delaware
        'MA': { lat: 42.2, lng: -71.5, zoom: 8 },     // Massachusetts
        'MD': { lat: 39.0, lng: -76.8, zoom: 8 },     // Maryland
        'ME': { lat: 44.6, lng: -69.8, zoom: 7 },     // Maine
        'NH': { lat: 43.4, lng: -71.5, zoom: 8 },     // New Hampshire
        'NJ': { lat: 40.3, lng: -74.5, zoom: 8 },     // New Jersey
        'NY': { lat: 42.2, lng: -74.9, zoom: 7 },     // New York
        'PA': { lat: 40.6, lng: -77.2, zoom: 7 },     // Pennsylvania
        'RI': { lat: 41.7, lng: -71.5, zoom: 9 },     // Rhode Island
        'VT': { lat: 44.0, lng: -72.7, zoom: 8 }      // Vermont
    };
    
    if (selectedState === 'all') {
        // Reset to full US view
        map.setView([39.8283, -98.5795], 4);
        loadCampingSpots();
    } else {
        // Zoom to selected state
        const stateBound = stateBounds[selectedState];
        if (stateBound) {
            map.setView([stateBound.lat, stateBound.lng], stateBound.zoom);
        }
        loadCampingSpots(selectedState);
    }
}

// Initialize map when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure all elements are ready
    setTimeout(function() {
        if (document.getElementById('map')) {
            initMap();
        } else {
            console.error('Map container not found!');
        }
    }, 100);
});