// Make map a global variable or pass it to fetchCampingSpots
// so markers can be added to it.
let map; // Declare map globally so fetchCampingSpots can access it
let campingMarkers = []; // Store camping spot markers separately

// State center coordinates for map positioning
const stateCoordinates = {
    'CO': [39.5, -105.5],
    'CA': [36.7, -119.7],
    'AZ': [34.0, -111.0],
    'UT': [39.3, -111.6],
    'NV': [38.8, -116.4],
    'WY': [43.0, -107.6],
    'MT': [47.0, -110.0],
    'ID': [44.0, -114.0],
    'WA': [47.4, -120.7],
    'OR': [44.0, -120.5]
};

document.addEventListener("DOMContentLoaded", () => {
    // Check if #map exists before initializing map logic
    const mapContainer = document.getElementById("map");
    if (mapContainer) {
        initMap(); // Initialize map first so 'map' object is available
    }
    fetchCampingSpots(); // Then fetch camping spots and add them to the map
    
    // NEW: Add state filter event listener
    const stateFilter = document.getElementById("state-filter");
    if (stateFilter) {
        stateFilter.addEventListener("change", () => {
            fetchCampingSpots(stateFilter.value);
        });
    }
    
    // NEW: Add form submission handler
    const addSpotForm = document.getElementById("add-spot-form");
    if (addSpotForm) {
        addSpotForm.addEventListener("submit", handleAddSpot);
    }
});

// UPDATED: Modified to accept state parameter and handle filtering
function fetchCampingSpots(state = "") {
    let url = "/api/camping_spots";
    if (state) {
        url += `?state=${state}`;
    }
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log("Fetched camping spots:", data); // Debug log
            
            const list = document.getElementById("camping-list");
            if (list) {
                list.innerHTML = "";
                
                // Clear ONLY camping markers (not forest boundaries/roads)
                if (map && campingMarkers.length > 0) {
                    campingMarkers.forEach(marker => {
                        map.removeLayer(marker);
                    });
                    campingMarkers = []; // Reset the array
                }
                
                // Move map to state if a state is selected
                if (state && stateCoordinates[state] && map) {
                    map.setView(stateCoordinates[state], 7);
                } else if (!state && map) {
                    // If "All States" is selected, zoom out to show more area
                    map.setView([39.5, -105.5], 5);
                }
                
                data.forEach(spot => {
                    const li = document.createElement("li");
                    li.textContent = `${spot.name} — ${spot.location}${spot.state ? ` (${spot.state})` : ''}`;
                    list.appendChild(li);

                    // Add markers for camping spots and store them
                    if (map && spot.latitude && spot.longitude) {
                        console.log("Adding marker for:", spot.name, spot.latitude, spot.longitude); // Debug log
                        
                        const marker = L.marker([spot.latitude, spot.longitude])
                            .addTo(map)
                            .bindPopup(`<b>${spot.name}</b><br>${spot.description || spot.location}${spot.state ? `<br><strong>State:</strong> ${spot.state}` : ''}`);
                        
                        campingMarkers.push(marker); // Store the marker reference
                    }
                });
                
                console.log("Total camping markers:", campingMarkers.length); // Debug log
                
                // Show message if no spots found
                if (data.length === 0) {
                    const li = document.createElement("li");
                    li.textContent = state ? `No camping spots found in ${state}` : "No camping spots available";
                    li.style.fontStyle = "italic";
                    li.style.color = "#666";
                    list.appendChild(li);
                }
            }
        })
        .catch(err => {
            console.error("Error loading camping spots:", err);
        });
}

// NEW: Handle adding new spots
function handleAddSpot(event) {
    event.preventDefault();
    
    const spotData = {
        name: document.getElementById("spot-name").value,
        location: document.getElementById("spot-location").value,
        state: document.getElementById("spot-state").value,
        description: document.getElementById("spot-description").value,
        latitude: parseFloat(document.getElementById("spot-latitude").value) || null,
        longitude: parseFloat(document.getElementById("spot-longitude").value) || null
    };
    
    fetch("/api/camping_spots", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(spotData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Success! Spot added.");
            document.getElementById("add-spot-form").reset();
            fetchCampingSpots(); // Refresh the list
        } else {
            alert("Error adding spot: " + (data.error || "Unknown error"));
        }
    })
    .catch(err => {
        console.error("Error adding spot:", err);
        alert("Error adding spot. Please try again.");
    });
}

function initMap() {
    // Adjust view to Colorado where your data is filtered
    map = L.map("map").setView([39.5, -105.5], 7); 

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    console.log("Map initialized"); // Debug log

    // Load forest boundaries with popups - but don't let them interfere with camping markers
    fetch("/api/forest_boundaries")
        .then(res => res.json())
        .then(data => {
            console.log("Loading forest boundaries..."); // Debug log
            L.geoJSON(data, {
                style: { color: "green", weight: 2, fillOpacity: 0.1 },
                onEachFeature: function(feature, layer) {
                    // Use FORESTNAME property for USFS boundaries
                    const name = feature.properties?.FORESTNAME || "Unnamed Boundary"; 
                    layer.bindPopup(`<b>Forest:</b> ${name}`);
                }
            }).addTo(map);
        })
        .catch(err => {
            console.error("Error loading forest boundaries:", err);
            // Don't let forest boundary errors stop camping markers from working
        });

    // Load forest roads with popups - but don't let them interfere with camping markers
    fetch("/api/forest_roads")
        .then(res => res.json())
        .then(data => {
            console.log("Loading forest roads..."); // Debug log
            L.geoJSON(data, {
                style: { color: "gray", weight: 1 },
                onEachFeature: function(feature, layer) {
                    // Check console.log(feature.properties) to confirm road name property
                    const name = feature.properties && (feature.properties.NAME || feature.properties.Name) || "Unnamed Road";
                    layer.bindPopup(`<b>Road:</b> ${name}`);
                }
            }).addTo(map);
        })
        .catch(err => {
            console.error("Error loading forest roads:", err);
            // Don't let road errors stop camping markers from working
        });
}