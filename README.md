# FreeCampFinder
# Public Land Camping Finder App

This is a Flask web app that helps users find public land camping spots.

## Setup

1. Create a virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

pip install -r requirements.txt

python app.py

export FLASK_RUN_OPEN_BROWSER=true
flask run

# After installing requirements, you can also run:
export FLASK_APP=app.py
export FLASK_ENV=development
flask run
