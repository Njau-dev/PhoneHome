from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_restful import Api
from flask_cors import CORS

# initialize SQLAlchemy
db = SQLAlchemy()

# initialize JWT
jwt = JWTManager()

# initialize migrations
migrate = Migrate()

api = Api()

cors = CORS()
