from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import bcrypt

from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    get_jwt,
    jwt_required,
    JWTManager
)

import os
from datetime import datetime, timedelta, timezone
from pymongo import MongoClient
from pymongo.errors import ConfigurationError
from bson import ObjectId
from dotenv import load_dotenv
from email_sender import send_email


app = Flask(__name__)


load_dotenv()


# --- App Configuration ---
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/employee_wellness_analytics')
MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'employee_wellness_analytics')
CORS(app, supports_credentials=True, origins=os.getenv('FRONTEND_ORIGIN', 'http://localhost:5173'))


# --- JWT Configuration ---
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "default-super-secret-key-for-dev")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=int(os.getenv('JWT_EXPIRES_MINUTES', '60')))
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_ACCESS_COOKIE_NAME"] = "access_token"
app.config["JWT_COOKIE_CSRF_PROTECT"] = False
jwt = JWTManager(app)

# --- MongoDB Connection ---
# Explicit TLS settings to avoid Atlas SSL handshake failures in some environments


client = MongoClient(
    MONGO_URI,
    serverSelectionTimeoutMS=20000,
)

# Attempt to get the default database from the URI, fallback to MONGO_DB_NAME if not specified
try:
    db = client.get_default_database()


except ConfigurationError:
    db = client.get_database(MONGO_DB_NAME)
users_collection = db.get_collection('users')
admin_collection = db.get_collection('admin')
reset_collection = db.get_collection('password_reset_requests')
health_records_collection = db.get_collection('health_records')

#--- Utility Functions ---
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))


def _generate_reset_otp(length: int = 6) -> str:
    # numeric OTP, zero-padded
    return str(int.from_bytes(os.urandom(4), 'big') % (10 ** length)).zfill(length)



def _generate_reset_token(num_bytes: int = 32) -> str:
    # URL-safe-ish token
    return os.urandom(num_bytes).hex()

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = (data.get('email') or '').lower()
    password = data.get('password') or ''
    entity_id = (data.get('entityId') or '').strip()
    role = data.get('role', 'Employee')  # Default to 'Employee'
    app.logger.debug(f"Attempting login for email: {email} with role: {role} and ID: {entity_id}")

    # Input validation
    try:
        # Check collection based on role
        if role == 'Admin':
            user = admin_collection.find_one({"email": email, "adminId": entity_id})
        elif role == 'Employee':
            user = users_collection.find_one({"email": email, "employeeId": entity_id})
        else:
            # Fallback for safety, though frontend should prevent this
            user = admin_collection.find_one({"email": email, "adminId": entity_id}) or \
                   users_collection.find_one({"email": email, "employeeId": entity_id})

        if not user:
            app.logger.warning(f"Login failed for {email}: User not found.")
            return jsonify({'detail': 'Invalid credentials'}), 401

        # Verify that the user has a password
        password_hash = user.get('password_hash')
        if not password_hash:
            app.logger.warning(f"Login failed for {email}: No password hash found for user.")
            return jsonify({'detail': 'Invalid credentials'}), 401

        # Verify the password using bcrypt
        try:
            # Verify the password using bcrypt
            if not verify_password(password, password_hash):
                app.logger.warning(f"Login failed for {email}: Incorrect password.")
                return jsonify({'detail': 'Invalid credentials'}), 401
            
        # Handle potential errors in password verification
        except (ValueError, TypeError):
            # Catches invalid hash format (e.g., old sha256 hashes, None, etc.)
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
        # The identity should be a simple string. We'll store user_info in additional claims.
        token = create_access_token(identity=user_id_str, additional_claims={"user_info": user_info})
        # Set the token in an HTTP-only cookie and return user info
        resp = make_response(jsonify({'user': user_info}))
        resp.set_cookie('access_token', token, httponly=True, samesite='Lax')
        return resp
    
    # Handle unexpected errors gracefully
    except Exception as e:
        app.logger.exception(f"An unexpected error occurred during login for {email}: {e}")
        return jsonify({'detail': 'Internal Server Error'}), 500


@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').lower().strip()
    password = data.get('password') or ''

    # Validate input 
    if not name or not email or not password:
        return jsonify({'detail': 'Missing required fields'}), 400

    if len(password) < 6:
        return jsonify({'detail': 'Password must be at least 6 characters long.'}), 400

    if len(password.encode('utf-8')) > 72:
        return jsonify({'detail': 'Password is too long (max 72 bytes).'}), 400

    # Check if the user already exists
    try:
        # Only allow signups into the collection that login checks for normal users.
        if users_collection.find_one({"email": email}):
            return jsonify({'detail': 'Account already exists'}), 409

        # Hash the password using bcrypt.
        pwd_hash = hash_password(password)

        # Generate a unique employee ID
        # We'll base it on the current number of users to ensure uniqueness
        user_count = users_collection.count_documents({})
        employee_id = f"EMP{user_count + 100}"

        # Generate a username by removing spaces and converting to lowercase
        username = name.replace(' ', '').lower()

        # Create the user document
        doc = {
            'name': name,
            'employeeId': employee_id,
            'username': username,
            'email': email,
            'password_hash': pwd_hash,
            'role': 'user',
            'createdAt': datetime.now(timezone.utc).isoformat(),
        }

        # Insert the new user into the users collection
        users_collection.insert_one(doc)
        return jsonify({'detail': 'Account created'}), 201
    
    # error handling for the SignUp failed
    except Exception as e:
        app.logger.exception(f"Signup failed for {email}: {e}")
        return jsonify({'detail': 'Internal Server Error'}), 500



@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = (data.get('email') or '').lower().strip()
    method = (data.get('method') or 'otp').lower().strip()  # otp | link

    # Validate input
    if not email:
        return jsonify({'detail': 'Missing email'}), 400

    # Validate method for reseting password
    if method not in {'otp', 'link'}:
        return jsonify({'detail': 'Invalid method'}), 400

    # Check if the user exists in either collection
    user = users_collection.find_one({'email': email})

    # Always return generic message to avoid account enumeration
    message_resp = {
        'detail': 'If an account exists for this email, a recovery option has been generated.'
    }

    # If the user does not exist, we still return the same message to prevent account enumeration
    if not user:
        return jsonify(message_resp), 200

    # Generate and store reset request
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=15)

    # Generate either an OTP or a reset token based on the method
    otp_code = None
    reset_token = None
    if method == 'otp':
        otp_code = _generate_reset_otp(6)
    else:
        reset_token = _generate_reset_token(32)

    # Store the reset request in the database
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
    # Get the JSON data from the request
    data = request.get_json() or {}
    email = (data.get('email') or '').lower().strip()
    new_password = data.get('newPassword') or ''
    otp = (data.get('otp') or '').strip()
    reset_token = (data.get('resetToken') or '').strip()

    # Log the request
    app.logger.info(
        "reset-password called: email=%s newPassword_len=%s has_otp=%s has_resetToken=%s", email, len(new_password) if new_password else 0, bool(otp), bool(reset_token)
    )

    # Validate input
    if not email:
        return jsonify({'detail': 'Missing required email field.'}), 400
    if not new_password:
        return jsonify({'detail': 'Missing new password.'}), 400
    if len(new_password) < 6:
        return jsonify({'detail': 'Password must be at least 6 characters long.'}), 400
    if len(new_password.encode('utf-8')) > 72:
        return jsonify({'detail': 'Password is too long (max 72 bytes).'}), 400
    if otp == '' and reset_token == '':
        return jsonify({'detail': 'A valid OTP or reset token is required.'}), 400

    try:
        # Find latest unused, unexpired reset request matching provided credential
        query = {
            'email': email,
            'used': False,
        }
        now = datetime.now(timezone.utc)

        # Add either otp or reset_token to the query if provided
        if otp != '':
            query['otp'] = otp
        if reset_token != '':
            query['reset_token'] = reset_token

        # Find the most recent reset request
        req = reset_collection.find_one(query, sort=[('created_at', -1)])
        if not req:
            return jsonify({'detail': 'Invalid or expired reset request.'}), 400

        # Check if the reset request has expired
        expires_at = datetime.fromisoformat(req['expires_at'])
        if expires_at < now:
            return jsonify({'detail': 'Reset request expired.'}), 400

        # Find the user in either users or admin collection
        user = users_collection.find_one({'email': email})
        target_collection = users_collection

        # If not found in users, check admin collection
        if not user:
            user = admin_collection.find_one({'email': email})
            target_collection = admin_collection

        # If still not found, return error
        if not user:
            return jsonify({'detail': 'User not found.'}), 404

        # Check if the new password is the same as the old one
        if verify_password(new_password, user['password_hash']):
            return jsonify({'detail': 'New password cannot be the same as the old password.'}), 400

        # Hash the new password using bcrypt
        pwd_hash = hash_password(new_password)
        target_collection.update_one({'_id': user['_id']}, {'$set': {'password_hash': pwd_hash}})
        reset_collection.update_one({'_id': req['_id']}, {'$set': {'used': True}})

        # Log the successful password reset
        return jsonify({'detail': 'Password updated successfully.'}), 200
    except Exception as e:
        app.logger.exception(f"Password reset failed for {email}: {e}")
        return jsonify({'detail': 'Internal Server Error'}), 500



@app.route('/api/auth/me', methods=['GET'])
@jwt_required(locations=["cookies"])
def me():
    # The identity is the user ID string. The full user info is in the claims.
    jwt_payload = get_jwt()
    user_info = jwt_payload.get("user_info")
    if not user_info:
        return jsonify({"detail": "User information not found in token"}), 404
    
    return jsonify({'user': user_info})



@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Clears the JWT access token cookie."""
    resp = make_response(jsonify({'detail': 'Logout successful'}), 200)
    resp.set_cookie('access_token', '', expires=0, httponly=True, samesite='Lax')
    return resp


# --- Wellness API Endpoints ---

@app.route('/api/wellness/health-records', methods=['GET'])
@jwt_required(locations=["cookies"])
def get_health_records():
    """Fetches all health records from the database."""
    try:
        records_cursor = health_records_collection.find({})
        records = []
        for record in records_cursor:
            # The frontend expects 'id' not '_id'. We'll use the string representation of ObjectId.
            record['id'] = str(record['_id'])
            del record['_id']
            records.append(record)
        # Sort by lastUpdated descending to match frontend logic
        records.sort(key=lambda r: r.get('lastUpdated', ''), reverse=True)
        return jsonify(records), 200
    except Exception as e:
        app.logger.exception(f"An unexpected error occurred while fetching health records: {e}")
        return jsonify({'detail': 'Internal Server Error'}), 500


@app.route('/api/wellness/health-records', methods=['POST'])
@jwt_required(locations=["cookies"])
def add_health_record():
    """Adds a new health record. Can be initiated by an admin or a new user."""
    jwt_payload = get_jwt()
    user_info = jwt_payload.get("user_info")
    new_record = request.get_json()

    if not new_record or 'employeeId' not in new_record:
        return jsonify({'detail': 'Missing health record data or employeeId'}), 400

    # Ensure a record with the same employeeId doesn't already exist
    if health_records_collection.find_one({'employeeId': new_record['employeeId']}):
        return jsonify({'detail': 'A health record for this employee already exists'}), 409

    try:
        # The frontend sends an 'id' field, which we don't need to store in Mongo's '_id'
        if 'id' in new_record:
            del new_record['id']

        result = health_records_collection.insert_one(new_record)
        new_record['id'] = str(result.inserted_id)
        return jsonify(new_record), 201
    except Exception as e:
        app.logger.exception(f"An unexpected error occurred while adding a health record: {e}")
        return jsonify({'detail': 'Internal Server Error'}), 500


@app.route('/api/wellness/health-records/<employee_id>', methods=['PUT'])
@jwt_required(locations=["cookies"])
def update_health_record(employee_id):
    """Updates an existing health record for a given employeeId."""
    jwt_payload = get_jwt()
    user_info = jwt_payload.get("user_info")
    updated_data = request.get_json()

    if not updated_data:
        return jsonify({'detail': 'Missing update data'}), 400

    # The frontend sends an 'id' field, which we don't need to store in Mongo's '_id'
    if 'id' in updated_data:
        del updated_data['id']

    try:
        result = health_records_collection.update_one({'employeeId': employee_id}, {'$set': updated_data})
        if result.matched_count == 0:
            return jsonify({'detail': 'Health record not found'}), 404
        return jsonify({'detail': 'Health record updated successfully'}), 200
    except Exception as e:
        app.logger.exception(f"An unexpected error occurred while updating health record for {employee_id}: {e}")
        return jsonify({'detail': 'Internal Server Error'}), 500

@app.route('/api/wellness/health-records/<employee_id>', methods=['DELETE'])
@jwt_required(locations=["cookies"])
def delete_health_record(employee_id):
    """Deletes an existing health record for a given employeeId."""
    # Ensure only admins can delete records
    jwt_payload = get_jwt()
    user_info = jwt_payload.get("user_info")
    if not user_info or user_info.get('role') != 'admin':
        return jsonify({'detail': 'Forbidden: You do not have permission to delete records.'}), 403

    try:
        result = health_records_collection.delete_one({'employeeId': employee_id})
        if result.deleted_count == 0:
            return jsonify({'detail': 'Health record not found'}), 404
        # Return 204 No Content on successful deletion
        return '', 204
    except Exception as e:
        app.logger.exception(f"An unexpected error occurred while deleting health record for {employee_id}: {e}")
        return jsonify({'detail': 'Internal Server Error'}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)