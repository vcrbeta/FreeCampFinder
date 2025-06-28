from flask import Flask, render_template, jsonify
import requests

from model import db, CampingSpot

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///camping.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/camping_spots")
def camping_spots():
    spots = CampingSpot.query.all()
    return jsonify([
        {
            "name": spot.name,
            "location": spot.location,
            "description": spot.description,
            "latitude": spot.latitude,
            "longitude": spot.longitude
        } for spot in spots
    ])


@app.route("/api/forest_boundaries")
def forest_boundaries():
    try:
        url = "https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_NFSBoundaries_01/MapServer/0/query?where=STATE='CO'&outFields=*&f=geojson"
        res = requests.get(url, timeout=20)
        res.raise_for_status()
        return res.json()
    except Exception as e:
        print(f"Error in /api/forest_boundaries: {e}")