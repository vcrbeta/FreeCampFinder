from app import app, db
from model import CampingSpot

with app.app_context():
    db.create_all()

    spot1 = CampingSpot(
        name="Bear Creek",
        location="Colorado",
        description="Free dispersed camping near forest roads.",
        latitude=39.6,
        longitude=-105.3
    )

    spot2 = CampingSpot(
        name="Sierra Pines",
        location="California",
        description="Near stream, shady area. Pet-friendly.",
        latitude=38.0,
        longitude=-120.3
    )

    db.session.add_all([spot1, spot2])
    db.session.commit()

    print("✅ Database seeded!")
