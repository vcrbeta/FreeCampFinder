from flask_sqlalchemy import SQLAlchemy

# Create a database object
db = SQLAlchemy()

class CampingSpot(db.Model):
    __tablename__ = "camping_spots"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)

    def __repr__(self):
        return f"<CampingSpot id={self.id} name={self.name} location={self.location}>"
