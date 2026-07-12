from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from passlib.hash import bcrypt
import hashlib

from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager
import os
from datetime import datetime, timedelta
from pymongo import MongoClient
from pymongo.errors import ConfigurationError
from bson import ObjectId
from dotenv import load_dotenv
from email_sender import send_email
 
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
# Explicit TLS settings to avoid Atlas SSL handshake failures in some environments

client = MongoClient(
    MONGO_URI,
    serverSelectionTimeoutMS=20000,
)

try:
    db = client.get_default_database()

except ConfigurationError:
    db = client.get_database(MONGO_DB_NAME)
users_collection = db.get_collection('users')
reset_collection = db.get_collection('password_reset_requests')


def _sha256_hex(s: str) -> str:
    return hashlib.sha256(s.encode('utf-8')).hexdigest()


def _generate_reset_otp(length: int = 6) -> str:
    # numeric OTP, zero-padded
    return str(int.from_bytes(os.urandom(4), 'big') % (10 ** length)).zfill(length)


def _generate_reset_token(num_bytes: int = 32) -> str:
    # URL-safe-ish token
    return hashlib.sha256(os.urandom(num_bytes)).hexdigest()


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
        # Signup currently stores SHA256(password) as password_hash (placeholder)
        # so login must verify against the same scheme.
        pwd_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
        if pwd_hash != user.get('password_hash'):
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

        pwd_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()

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


@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = (data.get('email') or '').lower().strip()
    method = (data.get('method') or 'otp').lower().strip()  # otp | link

    if not email:
        return jsonify({'detail': 'Missing email'}), 400

    if method not in {'otp', 'link'}:
        return jsonify({'detail': 'Invalid method'}), 400

    user = users_collection.find_one({'email': email})

    # Always return generic message to avoid account enumeration
    message_resp = {
        'detail': 'If an account exists for this email, a recovery option has been generated.'
    }

    if not user:
        return jsonify(message_resp), 200

    # Generate and store reset request
    now = datetime.utcnow()
    expires_at = now + timedelta(minutes=15)

    otp_code = None
    reset_token = None
    if method == 'otp':
        otp_code = _generate_reset_otp(6)
    else:
        reset_token = _generate_reset_token(32)

    req_doc = {
        'email': email,
        'otp': otp_code,
        'reset_token': reset_token,
        'expires_at': expires_at.isoformat(),
        'used': False,
        'created_at': now.isoformat(),
    }
    reset_collection.insert_one(req_doc)

    # Send email if SMTP is configured. Otherwise, fall back to debug values.
    resp_payload = message_resp.copy()
    try:
        frontend_origin = os.getenv('FRONTEND_ORIGIN', 'http://localhost:5173')
        if method == 'otp' and otp_code is not None:
            subject = 'Your password recovery code'
            text_body = f"Your OTP recovery code is: {otp_code}\n\nThis code expires in 15 minutes."
            html_body = f"<p>Your OTP recovery code is: <b>{otp_code}</b></p><p>This code expires in 15 minutes.</p>"
            send_email(email, subject, html_body, text_body)
        elif method == 'link' and reset_token is not None:
            subject = 'Your password reset link'
            reset_link = f"{frontend_origin}/forgot_password?token={reset_token}&email={email}"
            text_body = f"Reset your password using this link: {reset_link}\n\nThis link expires in 15 minutes."
            html_body = f"<p>Reset your password using this link:</p><p><a href='{reset_link}'>Reset password</a></p><p>This link expires in 15 minutes.</p>"
            send_email(email, subject, html_body, text_body)
    except Exception as e:
        # Prototype fallback
        app.logger.warning(f"Failed to send email (falling back to debug): {e}")
        if otp_code is not None:
            resp_payload['debugOtp'] = otp_code
        if reset_token is not None:
            resp_payload['debugResetToken'] = reset_token

    return jsonify(resp_payload), 200


@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    email = (data.get('email') or '').lower().strip()
    new_password = data.get('newPassword') or ''
    otp = (data.get('otp') or '').strip()
    reset_token = (data.get('resetToken') or '').strip()

    if not email:
        return jsonify({'detail': 'Missing email'}), 400
    if not new_password:
        return jsonify({'detail': 'Missing newPassword'}), 400
    if len(new_password) < 8:
        return jsonify({'detail': 'Password must be at least 8 characters long.'}), 400
    if otp == '' and reset_token == '':
        return jsonify({'detail': 'Provide otp or resetToken.'}), 400

    # Find latest unused, unexpired reset request matching provided credential
    query = {
        'email': email,
        'used': False,
    }
    now = datetime.utcnow()

    if otp != '':
        query['otp'] = otp
    if reset_token != '':
        query['reset_token'] = reset_token

    req = reset_collection.find_one(query, sort=[('created_at', -1)])
    if not req:
        return jsonify({'detail': 'Invalid or expired reset request.'}), 400

    expires_at = datetime.fromisoformat(req['expires_at'])
    if expires_at < now:
        return jsonify({'detail': 'Reset request expired.'}), 400

    user = users_collection.find_one({'email': email})
    if not user:
        return jsonify({'detail': 'User not found.'}), 404

    pwd_hash = _sha256_hex(new_password)
    users_collection.update_one({'_id': user['_id']}, {'$set': {'password_hash': pwd_hash}})
    reset_collection.update_one({'_id': req['_id']}, {'$set': {'used': True}})

    return jsonify({'detail': 'Password updated successfully.'}), 200


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
