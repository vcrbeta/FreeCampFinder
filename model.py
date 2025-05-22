
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Campsite(db.Model):
    __tablename__ = 'campsites'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(100))
    amenities = db.Column(db.String(200))
    rules = db.Column(db.String(200))

    def __repr__(self):
        return f"<Campsite {self.name}>"
