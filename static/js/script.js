document.addEventListener("DOMContentLoaded", () => {
    fetchCampingSpots();
});

function fetchCampingSpots() {
    fetch("/api/camping_spots")
        .then(response => response.json())
        .then(data => {
            const list = document.getElementById("camping-list");
            list.innerHTML = "";
            data.forEach(spot => {
                const li = document.createElement("li");
                li.textContent = `${spot.name} — Location: ${spot.location}`;
                list.appendChild(li);
            });
        })
        .catch(err => {
            console.error("Error loading camping spots:", err);
        });
}
