from flask import Flask, render_template, request, jsonify, redirect, session, flash, url_for
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import requests
import os

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///camping.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
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

def init_db():
    """Initialize database with sample data"""
    with app.app_context():
        print("Creating database tables...")
        db.create_all()
        
        # Add sample data if database is empty
        if CampingSpot.query.count() == 0:
            print("Adding sample camping spots...")
            sample_spots = [
                CampingSpot(
                    name="Bear Creek",
                    location="Near Guanella Pass",
                    description="Free dispersed camping near forest roads. Great views of the mountains.",
                    state="CO",
                    latitude=39.6,
                    longitude=-105.3
                ),
                CampingSpot(
                    name="Sierra Pines",
                    location="Stanislaus National Forest",
                    description="Near stream, shady area. Pet-friendly camping with hiking trails nearby.",
                    state="CA",
                    latitude=38.0,
                    longitude=-120.3
                ),
                CampingSpot(
                    name="Red Rock Canyon",
                    location="Moab Area",
                    description="Stunning red rock formations. Popular with rock climbers and hikers.",
                    state="UT",
                    latitude=38.7,
                    longitude=-109.6
                ),
                CampingSpot(
                    name="Lost Lake",
                    location="Roosevelt National Forest",
                    description="Peaceful lake camping with fishing opportunities. 4WD recommended.",
                    state="CO",
                    latitude=40.1,
                    longitude=-105.8
                )
            ]
            
            for spot in sample_spots:
                db.session.add(spot)
            db.session.commit()
            print("✅ Database initialized with sample data!")
        else:
            print("✅ Database already has data")

@app.route("/")
def index():
    return render_template("home.html")

@app.route("/map")
def map_view():
    return render_template("index.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        confirm_password = request.form.get("confirm_password")
        
        # Basic validation
        if not username or not password:
            flash("Username and password are required.", "error")
            return redirect("/register")
            
        if len(username) < 4:
            flash("Username must be at least 4 characters long.", "error")
            return redirect("/register")
            
        if len(password) < 6:
            flash("Password must be at least 6 characters long.", "error")
            return redirect("/register")
            
        if password != confirm_password:
            flash("Passwords must match.", "error")
            return redirect("/register")
        
        # Check if user exists
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            flash("Username already exists.", "error")
            return redirect("/register")

        # Create new user
        try:
            hashed_pw = generate_password_hash(password)
            new_user = User(username=username, password=hashed_pw)
            db.session.add(new_user)
            db.session.commit()
            flash("Registration successful!", "success")
            return redirect("/login")
        except Exception as e:
            db.session.rollback()
            flash(f"Registration failed: {str(e)}", "error")
            return redirect("/register")
        
    return render_template("register.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        
        print(f"Login attempt - Username: {username}, Password length: {len(password) if password else 0}")
        
        if not username or not password:
            flash("Username and password are required.", "error")
            return render_template("login.html")
        
        try:
            user = User.query.filter_by(username=username).first()
            print(f"User found: {user is not None}")
            
            if user and check_password_hash(user.password, password):
                session.clear()  # Clear any existing session
                session["user_id"] = user.id
                session["username"] = user.username
                session.permanent = True
                print(f"Login successful for user: {username}")
                flash("Login successful!", "success")
                return redirect("/map")
            else:
                print("Invalid credentials")
                flash("Invalid username or password.", "error")
        except Exception as e:
            print(f"Login error: {str(e)}")
            flash(f"Login error: {str(e)}", "error")
        
        return render_template("login.html")
        
    return render_template("login.html")

@app.route("/logout")
def logout():
    session.clear()
    flash("You have been logged out.", "info")
    # Force session to be saved
    session.modified = True
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

        # Validate required fields
        required_fields = ["name", "location", "state", "latitude", "longitude"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"success": False, "error": f"Missing required field: {field}"}), 400

        try:
            new_spot = CampingSpot(
                name=data.get("name"),
                location=data.get("location"),
                description=data.get("description", ""),
                state=data.get("state"),
                latitude=float(data.get("latitude")),
                longitude=float(data.get("longitude"))
            )
            db.session.add(new_spot)
            db.session.commit()
            return jsonify({"success": True, "id": new_spot.id}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"success": False, "error": str(e)}), 500

    # GET request - handle state filtering
    state = request.args.get("state")
    query = CampingSpot.query
    if state:
        query = query.filter_by(state=state)
    
    spots = query.all()
    return jsonify([
        {
            "id": s.id,
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
        params = {
            "where": "1=1", 
            "outFields": "*", 
            "f": "geojson",
            "resultRecordCount": 100  # Reduced for better performance
        }
        response = requests.get(usfs_url, params=params, timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching forest boundaries: {e}")
        return jsonify({"error": "Failed to fetch forest boundaries", "details": str(e)}), 500

@app.route("/api/forest_roads")
def get_forest_roads():
    try:
        roads_url = "https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_RoadBasic_01/MapServer/0/query"
        params = {
            "where": "1=1", 
            "outFields": "*", 
            "f": "geojson",
            "resultRecordCount": 100  # Reduced for better performance
        }
        response = requests.get(roads_url, params=params, timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching forest roads: {e}")
        return jsonify({"error": "Failed to fetch forest roads", "details": str(e)}), 500

@app.route("/debug")
def debug():
    spots = CampingSpot.query.all()
    users = User.query.all()
    return jsonify({
        "camping_spots": [
            {
                "id": s.id,
                "name": s.name,
                "location": s.location,
                "state": s.state,
                "latitude": s.latitude,
                "longitude": s.longitude
            } for s in spots
        ],
        "users": [
            {
                "id": u.id,
                "username": u.username
            } for u in users
        ],
        "users_count": len(users),
        "current_session": {
            "user_id": session.get("user_id"),
            "username": session.get("username"),
            "is_logged_in": "user_id" in session
        }
    })

@app.route("/clear-session")
def clear_session():
    """Helper route to clear session for debugging"""
    session.clear()
    flash("Session cleared", "info")
    return redirect("/")

if __name__ == "__main__":
    print("🚀 Starting FreeCampFinder app...")
    
    # Clear any existing sessions when starting fresh
    app.permanent_session_lifetime = 3600  # 1 hour session timeout
    
    init_db()
    print("🌐 App running at: http://localhost:5000")
    print("🔧 Debug mode: ON")
    print("📊 Visit /debug to see database contents")
    print("🗝️  To test login, register a new user or use the /debug endpoint")
    app.run(debug=True)