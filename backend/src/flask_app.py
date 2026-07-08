from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from passlib.hash import bcrypt
import os
import jwt
from datetime import datetime, timedelta
from pymongo import MongoClient
from pymongo.errors import ConfigurationError
from bson import ObjectId
 
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/employee_wellness_analytics')
MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'wellness_app')
JWT_SECRET = os.getenv('JWT_SECRET', 'devsecret')
JWT_ALGO = 'HS256'
JWT_EXPIRES_MINUTES = int(os.getenv('JWT_EXPIRES_MINUTES', '60'))

client = MongoClient(MONGO_URI)
try:
    db = client.get_default_database()
except ConfigurationError:
    db = client.get_database(MONGO_DB_NAME)
admin_col = db.get_collection('admin')
users_col = db.get_collection('users')
employees_col = db.get_collection('employees')

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=os.getenv('FRONTEND_ORIGIN', 'http://localhost:5173'))


def create_token(user_id: str, role: str):
    expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRES_MINUTES)
    payload = {"sub": str(user_id), "role": role, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def verify_token(token: str):
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        return data
    except Exception:
        return None


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = (data.get('email') or '').lower()
    password = data.get('password') or ''
    app.logger.debug(f"Attempting login for email: {email}")

    try:
        # Check collections in order: admin, then employees, then users
        user = admin_col.find_one({"email": email})
        if not user:
            user = employees_col.find_one({"email": email})
        if not user:
            user = users_col.find_one({"email": email})

        if not user:
            app.logger.warning(f"Login failed for {email}: User not found.")
            return jsonify({'detail': 'Invalid credentials'}), 401
        if not bcrypt.verify(password, user['password_hash']):
            app.logger.warning(f"Login failed for {email}: Incorrect password.")
            return jsonify({'detail': 'Invalid credentials'}), 401

        token = create_token(str(user['_id']), user.get('role', 'user'))
        user_info = {k: v for k, v in user.items() if k != 'password_hash'}
        # Frontend expects `user.name` for avatar fallback and greetings.
        # Admin docs use `username`, so map it to `name` if needed.
        if not user_info.get('name') and user_info.get('username'):
            user_info['name'] = user_info['username']
        user_info['id'] = str(user_info.pop('_id'))
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
        existing = employees_col.find_one({"email": email}) or users_col.find_one({"email": email})
        if existing:
            return jsonify({'detail': 'Account already exists'}), 409

        pwd_hash = bcrypt.hash(password)
        username = name.replace(' ', '').lower()
        doc = {
            'name': name,
            'username': username,
            'email': email,
            'password_hash': pwd_hash,
            'role': 'user',
            'createdAt': datetime.utcnow().isoformat(),
        }
        employees_col.insert_one(doc)
        return jsonify({'detail': 'Account created'}), 201
    except Exception as e:
        app.logger.exception(f"Signup failed for {email}: {e}")
        return jsonify({'detail': 'Internal Server Error'}), 500


@app.route('/api/auth/me', methods=['GET'])
def me():
    token = request.cookies.get('access_token') or ''
    if not token:
        return jsonify({'detail': 'Not authenticated'}), 401
    data = verify_token(token)
    if not data:
        return jsonify({'detail': 'Invalid token'}), 401
    try:
        uid = ObjectId(data['sub'])
    except Exception:
        return jsonify({'detail': 'Invalid token data'}), 401

    # Check collections in order: admin, then employees, then users
    user = admin_col.find_one({'_id': uid})
    if not user:
        user = employees_col.find_one({'_id': uid})
    if not user:
        user = users_col.find_one({'_id': uid})

    if not user:
        return jsonify({'detail': 'User not found'}), 401
    user_info = {k: v for k, v in user.items() if k != 'password_hash'}
    user_info['id'] = str(user_info.pop('_id'))
    return jsonify({'user': user_info})


if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)
