# from flask import Flask
# from flask_sqlalchemy import SQLAlchemy
# from flask_migrate import Migrate
# from flask_restful import Api
# from flask_cors import CORS
# from flask_jwt_extended import JWTManager
# from models import db  # Ensure the correct import

# app = Flask(__name__)

# # Configuration
# app.config['SECRET_KEY'] = '9b5d1a90246ca41fd5d81cf8debdc4ecb5bb82d7b7fb69a46aad44c2ca55e8ae'
# app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///phonehub.db'
# app.config['JWT_SECRET_KEY'] = 'b4506f4f33d07a7467281fc9d373de85cc97b4c104334d0c7553fad7c6deea1b'
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# # Initialize Extensions
# db.init_app(app)  # Use db.init_app instead of db = SQLAlchemy(app)
# migrate = Migrate(app, db)
# cors = CORS(app)
# api = Api(app)
# jwt = JWTManager(app)

import cloudinary
import cloudinary.uploader
import cloudinary.api

cloudinary.config(
  cloud_name = 'dzag5lm0e',   
  api_key = '768311535983232',
  api_secret = 'xWcspYk6pgg5wC21WzxYG_T-pd8'
)