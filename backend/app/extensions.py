from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

# initialize SQLAlchemy
db = SQLAlchemy()

# initialize JWT
jwt = JWTManager()

# initialize migrations
migrate = Migrate()


# Load CORS options from app config in create_app.
cors = CORS()
