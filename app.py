from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import requests

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///camping.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

class CampingSpot(db.Model):
    __tablename__ = "camping_spots"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/camping_spots", methods=["GET", "POST"])
def camping_spots():
    if request.method == "POST":
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "Invalid JSON"}), 400

        new_spot = CampingSpot(
            name=data.get("name"),
            location=data.get("location"),
            description=data.get("description"),
            latitude=data.get("latitude"),
            longitude=data.get("longitude")
        )
        db.session.add(new_spot)
        db.session.commit()
        return jsonify({"success": True, "id": new_spot.id}), 201

    spots = CampingSpot.query.all()
    return jsonify([
        {
            "name": s.name,
            "location": s.location,
            "description": s.description,
            "latitude": s.latitude,
            "longitude": s.longitude
        } for s in spots
    ])

@app.route("/api/forest_boundaries")
def get_forest_boundaries():
    try:
        usfs_url = "https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_NFSBoundaries_01/MapServer/0/query"
        params = {"where": "1=1", "outFields": "*", "f": "geojson"}
        response = requests.get(usfs_url, params=params)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return jsonify({"error": "Failed to fetch forest boundaries", "details": str(e)}), 500

@app.route("/api/forest_roads")
def get_forest_roads():
    try:
        roads_url = "https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_RoadBasic_01/MapServer/0/query"
        params = {"where": "1=1", "outFields": "*", "f": "geojson"}
        response = requests.get(roads_url, params=params)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return jsonify({"error": "Failed to fetch forest roads", "details": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
