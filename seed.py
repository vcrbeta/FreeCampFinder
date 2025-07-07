from app import app, db
from model import CampingSpot

with app.app_context():
    db.create_all()

    # Clear existing data
    db.session.query(CampingSpot).delete()

    spot1 = CampingSpot(
        name="Bear Creek",
        location="Near Guanella Pass",
        description="Free dispersed camping near forest roads. Great views of the mountains.",
        state="CO",  # NEW: Added state
        latitude=39.6,
        longitude=-105.3
    )

    spot2 = CampingSpot(
        name="Sierra Pines",
        location="Stanislaus National Forest",
        description="Near stream, shady area. Pet-friendly camping with hiking trails nearby.",
        state="CA",  # NEW: Added state
        latitude=38.0,
        longitude=-120.3
    )

    spot3 = CampingSpot(
        name="Red Rock Canyon",
        location="Moab Area",
        description="Stunning red rock formations. Popular with rock climbers and hikers.",
        state="UT",  # NEW: Added another spot
        latitude=38.7,
        longitude=-109.6
    )

    spot4 = CampingSpot(
        name="Lost Lake",
        location="Roosevelt National Forest",
        description="Peaceful lake camping with fishing opportunities. 4WD recommended.",
        state="CO",  # NEW: Another CO spot for testing filtering
        latitude=40.1,
        longitude=-105.8
    )

    db.session.add_all([spot1, spot2, spot3, spot4])
    db.session.commit()

    print("✅ Database seeded with state data!")