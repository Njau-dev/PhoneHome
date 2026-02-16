from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

# Import configuration
from app.config.base import BaseConfig

# initialize SQLAlchemy
db = SQLAlchemy()

# initialize JWT
jwt = JWTManager()

# initialize migrations
migrate = Migrate()


cors = CORS(resources=BaseConfig.CORS_RESOURCES, origins=BaseConfig.CORS_ORIGINS,
            supports_credentials=BaseConfig.CORS_SUPPORTS_CREDENTIALS)
