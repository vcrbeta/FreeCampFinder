from flask import Flask, render_template, request, jsonify, redirect, session, flash, url_for
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import requests

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///camping.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'  # Change this in production
db = SQLAlchemy(app)

class CampingSpot(db.Model):
    __tablename__ = "camping_spots"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    state = db.Column(db.String(2))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), nullable=False, unique=True)
    password = db.Column(db.String(200), nullable=False)

@app.route("/")
def index():
    return render_template("home.html")

@app.route("/map")
def map_view():
    return render_template("index.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    from forms import RegisterForm
    form = RegisterForm()
    if form.validate_on_submit():
        existing_user = User.query.filter_by(username=form.username.data).first()
        if existing_user:
            flash("Username already exists.")
            return redirect("/register")

        hashed_pw = generate_password_hash(form.password.data)
        new_user = User(username=form.username.data, password=hashed_pw)
        db.session.add(new_user)
        db.session.commit()
        flash("Registration successful!")
        return redirect("/login")
    return render_template("register.html", form=form)

@app.route("/login", methods=["GET", "POST"])
def login():
    from forms import LoginForm
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user and check_password_hash(user.password, form.password.data):
            session["user_id"] = user.id
            session["username"] = user.username
            flash("Login successful!")
            return redirect("/map")
        flash("Invalid username or password.")
    return render_template("login.html", form=form)

@app.route("/logout")
def logout():
    session.clear()
    flash("You have been logged out.")
    return redirect("/")

@app.route("/api/camping_spots", methods=["GET", "POST"])
def camping_spots():
    if request.method == "POST":
        # Check if user is logged in for adding spots
        if "user_id" not in session:
            return jsonify({"success": False, "error": "Please log in to add camping spots"}), 401
            
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "Invalid JSON"}), 400

        new_spot = CampingSpot(
            name=data.get("name"),
            location=data.get("location"),
            description=data.get("description"),
            state=data.get("state"),
            latitude=data.get("latitude"),
            longitude=data.get("longitude")
        )
        db.session.add(new_spot)
        db.session.commit()
        return jsonify({"success": True, "id": new_spot.id}), 201

    # GET request - handle state filtering
    state = request.args.get("state")
    query = CampingSpot.query
    if state:
        query = query.filter_by(state=state)
    
    spots = query.all()
    return jsonify([
        {
            "name": s.name,
            "location": s.location,
            "description": s.description,
            "state": s.state,
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

@app.route("/debug")
def debug():
    spots = CampingSpot.query.all()
    return jsonify([
        {
            "id": s.id,
            "name": s.name,
            "location": s.location,
            "state": s.state,
            "latitude": s.latitude,
            "longitude": s.longitude
        } for s in spots
    ])

if __name__ == "__main__":
    app.run(debug=True)