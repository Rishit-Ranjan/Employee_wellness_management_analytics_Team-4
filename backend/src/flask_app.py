from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from passlib.hash import bcrypt
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager
import os
from datetime import datetime, timedelta
from pymongo import MongoClient
from pymongo.errors import ConfigurationError
from bson import ObjectId
from dotenv import load_dotenv
 
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/employee_wellness_analytics')
MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'wellness_app')

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=os.getenv('FRONTEND_ORIGIN', 'http://localhost:5173'))

load_dotenv()

# --- JWT Configuration ---
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "default-super-secret-key-for-dev")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=int(os.getenv('JWT_EXPIRES_MINUTES', '60')))
jwt = JWTManager(app)

# --- MongoDB Connection ---
client = MongoClient(MONGO_URI)
try:
    db = client.get_default_database()
except ConfigurationError:
    db = client.get_database(MONGO_DB_NAME)
users_collection = db.get_collection('users')


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = (data.get('email') or '').lower()
    password = data.get('password') or ''
    app.logger.debug(f"Attempting login for email: {email}")

    try:
        # Check collections in order: admin, then employees, then users
        user = users_collection.find_one({"email": email})
        if not user:
            app.logger.warning(f"Login failed for {email}: User not found.")
            return jsonify({'detail': 'Invalid credentials'}), 401
        if not bcrypt.verify(password, user['password_hash']):
            app.logger.warning(f"Login failed for {email}: Incorrect password.")
            return jsonify({'detail': 'Invalid credentials'}), 401

        # Prepare user data for the token and response
        user_id_str = str(user['_id'])
        user_info = {
            "id": user_id_str,
            "name": user.get('name') or user.get('username'),
            "email": user['email'],
            "role": user.get('role', 'user'),
            "avatarUrl": user.get("avatarUrl", f"https://i.pravatar.cc/150?u={email}")
        }

        # Create token with user_info as the identity
        token = create_access_token(identity=user_info)

        resp = make_response(jsonify({'user': user_info}))
        resp.set_cookie('access_token', token, httponly=True, samesite='Lax')
        return resp
    except Exception as e:
        app.logger.exception(f"An unexpected error occurred during login for {email}: {e}")
        return jsonify({'detail': 'Internal Server Error'}), 500


@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').lower().strip()
    password = data.get('password') or ''

    if not name or not email or not password:
        return jsonify({'detail': 'Missing required fields'}), 400

    try:
        # Only allow signups into the collection that login checks for normal users.
        if users_collection.find_one({"email": email}):
            return jsonify({'detail': 'Account already exists'}), 409

        # bcrypt (and passlib's bcrypt backend) only uses first 72 bytes
        # to avoid ValueError: password cannot be longer than 72 bytes
        pwd_hash = bcrypt.hash(password[:72])

        username = name.replace(' ', '').lower()
        doc = {
            'name': name,
            'username': username,
            'email': email,
            'password_hash': pwd_hash,
            'role': 'user',
            'createdAt': datetime.utcnow().isoformat(),
        }
        users_collection.insert_one(doc)
        return jsonify({'detail': 'Account created'}), 201
    except Exception as e:
        app.logger.exception(f"Signup failed for {email}: {e}")
        return jsonify({'detail': 'Internal Server Error'}), 500


@app.route('/api/auth/me', methods=['GET'])
@jwt_required(locations=["cookies"])
def me():
    # We can get the user information from the JWT identity
    current_user = get_jwt_identity()
    if not current_user:
        return jsonify({"detail": "User not found from token"}), 404
    
    return jsonify({'user': current_user})


if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)
