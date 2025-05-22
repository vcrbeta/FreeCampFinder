import requests
from flask import Flask, render_template, jsonify

app = Flask(__name__)

# ✅ Route for homepage
@app.route("/")
def index():
    return render_template("index.html")

# Sample data for AJAX demo
camping_spots = [
    {"id": 1, "name": "Pine Grove Campground", "location": "National Forest"},
    {"id": 2, "name": "Sunset Ridge", "location": "National Park"},
]

# Proxy live USFS boundaries data
@app.route("/api/forest_boundaries")
def get_forest_boundaries():
    usfs_url = "https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_NFSBoundaries_01/MapServer/0/query"
    params = {
        "where": "1=1",
        "outFields": "*",
        "f": "geojson"
    }
    response = requests.get(usfs_url, params=params)
    return response.json()

# Proxy MVUM (roads/trails)
@app.route("/api/forest_roads")
def get_forest_roads():
    roads_url = "https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_RoadBasic_01/MapServer/0/query"
    params = {
        "where": "1=1",
        "outFields": "*",
        "f": "geojson"
    }
    response = requests.get(roads_url, params=params)
    return response.json()

if __name__ == "__main__":
    app.run(debug=True)
