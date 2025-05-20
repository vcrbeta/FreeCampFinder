from flask import Flask, render_template, jsonify

app = Flask(__name__)

# Sample data for AJAX demo
camping_spots = [
    {"id": 1, "name": "Pine Grove Campground", "location": "National Forest"},
    {"id": 2, "name": "Sunset Ridge", "location": "National Park"},
]

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/camping_spots")
def get_camping_spots():
    return jsonify(camping_spots)

if __name__ == "__main__":
    app.run(debug=True)
