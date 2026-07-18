from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import bcrypt
from flask_jwt_extended import create_refresh_token

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
import joblib
import pandas as pd
from email_sender import send_email


app = Flask(__name__)


load_dotenv()


# --- App Configuration ---
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/employee_wellness_analytics')
MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'employee_wellness_analytics')
CORS(app, supports_credentials=True, origins=os.getenv('FRONTEND_ORIGIN', 'http://localhost:5173'))


# --- JWT Configuration ---
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "default-super-secret-key-for-dev")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=int(os.getenv('JWT_EXPIRES_MINUTES', '1440'))) # 24-hour token for presentation
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
daily_habits_collection = db.get_collection('daily_habits')
mental_health_logs_collection = db.get_collection('mental_health_logs')

# --- Load ML Model and Metadata ---
try:
    # Correctly locate the 'backend' directory from the 'src' directory
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    MODELS_DIR = os.path.join(BASE_DIR, "models")
    
    risk_model = joblib.load(os.path.join(MODELS_DIR, "wellness_risk_model.pkl"))
    target_encoder = joblib.load(os.path.join(MODELS_DIR, "target_encoder.pkl"))
    feature_columns = joblib.load(os.path.join(MODELS_DIR, "feature_columns.pkl"))
    app.logger.info("Wellness risk prediction model loaded successfully.")
except Exception as e:
    app.logger.error(f"Error loading ML model: {e}")
    risk_model = None
    target_encoder = None
    feature_columns = None
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
        
        # Ensure employeeId is present for employee roles, generate if missing (for legacy users)
        if role == 'Employee' and not user.get('employeeId'):
            # Generate a new employeeId based on current user count
            user_count = users_collection.count_documents({})
            new_employee_id = f"EMP{user_count + 100}" # Ensure uniqueness, could be more robust
            users_collection.update_one(
                {'_id': user['_id']},
                {'$set': {'employeeId': new_employee_id}}
            )
            user['employeeId'] = new_employee_id # Update the user object in memory

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
            "employeeId": user.get('employeeId'), # Add employeeId here
            "role": user.get('role', 'user'),
            "avatarUrl": user.get("avatarUrl", f"https://i.pravatar.cc/150?u={email}")
        }

        # Create token with user_info as the identity
        # The identity should be a simple string. We'll store user_info in additional claims.
        access_token = create_access_token(identity=user_id_str, additional_claims={"user_info": user_info})

        # Set the token in an HTTP-only cookie and return user info
        resp = make_response(jsonify({'user': user_info}))
        resp.set_cookie('access_token', access_token, httponly=True, samesite='Lax')
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
    """Clears the access token cookie."""
    resp = make_response(jsonify({'detail': 'Logout successful'}), 200)
    resp.set_cookie('access_token', '', expires=0)
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

    # Parse bloodPressure into systolic and diastolic
    if 'bloodPressure' in new_record and isinstance(new_record['bloodPressure'], str):
        bp_parts = new_record['bloodPressure'].split('/')
        if len(bp_parts) == 2:
            try:
                new_record['bloodPressureSystolic'] = int(bp_parts[0])
                new_record['bloodPressureDiastolic'] = int(bp_parts[1])
            except ValueError:
                app.logger.warning(f"Invalid bloodPressure format for {new_record.get('employeeId')}: {new_record['bloodPressure']}")
                # Optionally, you could return an error here or just proceed without parsing

    # Ensure a record with the same employeeId doesn't already exist
    if health_records_collection.find_one({'employeeId': new_record['employeeId']}):
        return jsonify({'detail': 'A health record for this employee already exists'}), 409

    try:
        # The frontend sends an 'id' field, which we don't need to store in Mongo's '_id'
        if 'id' in new_record:
            del new_record['id']

        new_record['createdAt'] = datetime.now(timezone.utc).isoformat()

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

    # Parse bloodPressure into systolic and diastolic
    if 'bloodPressure' in updated_data and isinstance(updated_data['bloodPressure'], str):
        bp_parts = updated_data['bloodPressure'].split('/')
        if len(bp_parts) == 2:
            try:
                updated_data['bloodPressureSystolic'] = int(bp_parts[0])
                updated_data['bloodPressureDiastolic'] = int(bp_parts[1])
            except ValueError:
                app.logger.warning(f"Invalid bloodPressure format for {employee_id}: {updated_data['bloodPressure']}")

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

@app.route('/api/users', methods=['GET'])
@jwt_required(locations=["cookies"])
def get_all_users():
    """ Fetches all users with the 'user' role. Admin-only endpoint. """
    jwt_payload = get_jwt()
    user_info = jwt_payload.get("user_info")
    if not user_info or user_info.get('role') != 'admin':
        return jsonify({'detail': 'Forbidden: You do not have permission to access this resource.'}), 403

    try:
        users_cursor = users_collection.find({}, {'password_hash': 0}) # Exclude password hash
        users = []
        for user in users_cursor:
            user['id'] = str(user['_id'])
            del user['_id']
            users.append(user)
        return jsonify(users), 200
    except Exception as e:
        app.logger.exception(f"An unexpected error occurred while fetching all users: {e}")
        return jsonify({'detail': 'Internal Server Error'}), 500

def map_health_record_to_model_input(record):
    """
    Transforms a single health record into a pandas DataFrame suitable for the ML model.
    This includes one-hot encoding for categorical features.
    """
    # Create a DataFrame from the single record
    df = pd.DataFrame([record])

    # One-hot encode categorical features, ensuring consistency with training
    df = pd.get_dummies(df, columns=["gender", "medical_condition", "smoker", "alcohol_use"], drop_first=True)

    # Reindex the DataFrame to match the model's expected feature columns
    # `fill_value=0` handles cases where a category in the live data wasn't in the training data
    df = df.reindex(columns=feature_columns, fill_value=0)
    
    return df

@app.route('/api/wellness/risks', methods=['GET'])
@jwt_required(locations=["cookies"])
def get_wellness_risks():
    """
    Fetches all health records, predicts the wellness risk for each,
    and returns a list of risk profiles.
    """
    if not all([risk_model, target_encoder, feature_columns]):
        return jsonify({'detail': 'ML model is not available.'}), 503

    try:
        health_records = list(health_records_collection.find({}))
        if not health_records:
            return jsonify([]), 200

        risk_profiles = []
        for record in health_records:
            # Prepare the record for the model
            model_input_df = map_health_record_to_model_input(record)

            # Predict the risk
            prediction_encoded = risk_model.predict(model_input_df)
            prediction_label = target_encoder.inverse_transform(prediction_encoded)[0]

            # Basic logic to determine risk score and factors (can be enhanced)
            risk_score = 0
            if prediction_label == 'High':
                risk_score = 80
            elif prediction_label == 'Medium':
                risk_score = 55
            elif prediction_label == 'Low':
                risk_score = 25

            # Construct the risk profile object
            risk_profile = {
                "employeeId": record.get("employeeId"),
                "employeeName": record.get("employeeName"),
                "riskType": prediction_label,
                "riskScore": risk_score,
                "factors": [f"Predicted as {prediction_label} risk by model."],
                "recommendationAction": f"Follow standard protocol for {prediction_label} risk employees."
            }
            risk_profiles.append(risk_profile)

        return jsonify(risk_profiles), 200
    except Exception as e:
        app.logger.exception(f"An unexpected error occurred during risk prediction: {e}")
        return jsonify({'detail': 'Internal Server Error'}), 500

# --- Daily Habits API Endpoints ---
@app.route('/api/wellness/daily-habits/<employee_id>', methods=['GET'])
@jwt_required(locations=["cookies"])
def get_daily_habits(employee_id):
    """Fetches a specific user's daily habits record."""
    jwt_payload = get_jwt()
    user_info = jwt_payload.get("user_info")
    # Ensure user can only fetch their own record unless they are an admin
    if user_info.get('role') != 'admin' and user_info.get('employeeId') != employee_id:
        return jsonify({'detail': 'Forbidden: You can only view your own daily habits.'}), 403

    try:
        habit_record = daily_habits_collection.find_one({'employeeId': employee_id})
        if not habit_record:
            return jsonify({'detail': 'Daily habits record not found'}), 404
        habit_record['id'] = str(habit_record['_id'])
        del habit_record['_id']
        return jsonify(habit_record), 200
    except Exception as e:
        app.logger.exception(f"An unexpected error occurred while fetching daily habits for {employee_id}: {e}")
        return jsonify({'detail': 'Internal Server Error'}), 500

@app.route('/api/wellness/daily-habits', methods=['POST'])
@jwt_required(locations=["cookies"])
def add_daily_habit():
    """Adds a new daily habit record."""
    jwt_payload = get_jwt()
    user_info = jwt_payload.get("user_info")
    new_habit = request.get_json()

    if not new_habit or 'employeeId' not in new_habit:
        return jsonify({'detail': 'Missing daily habit data or employeeId'}), 400

    # Ensure user can only add their own record unless they are an admin
    if user_info.get('role') != 'admin' and user_info.get('employeeId') != new_habit['employeeId']:
        return jsonify({'detail': 'Forbidden: You can only add your own daily habits.'}), 403

    if daily_habits_collection.find_one({'employeeId': new_habit['employeeId']}):
        return jsonify({'detail': 'Daily habits record for this employee already exists'}), 409

    try:
        if 'id' in new_habit:
            del new_habit['id']
        result = daily_habits_collection.insert_one(new_habit)
        new_habit['id'] = str(result.inserted_id)
        return jsonify(new_habit), 201
    except Exception as e:
        app.logger.exception(f"An unexpected error occurred while adding a daily habit record: {e}")
        return jsonify({'detail': 'Internal Server Error'}), 500

@app.route('/api/wellness/daily-habits/<employee_id>', methods=['PUT'])
@jwt_required(locations=["cookies"])
def update_daily_habit(employee_id):
    """Updates an existing daily habit record for a given employeeId."""
    jwt_payload = get_jwt()
    user_info = jwt_payload.get("user_info")
    updated_data = request.get_json()

    if not updated_data:
        return jsonify({'detail': 'Missing update data'}), 400

    # Ensure user can only update their own record unless they are an admin
    if user_info.get('role') != 'admin' and user_info.get('employeeId') != employee_id:
        return jsonify({'detail': 'Forbidden: You can only update your own daily habits.'}), 403

    if 'id' in updated_data:
        del updated_data['id']

    try:
        result = daily_habits_collection.update_one({'employeeId': employee_id}, {'$set': updated_data})
        if result.matched_count == 0:
            return jsonify({'detail': 'Daily habits record not found'}), 404
        return jsonify({'detail': 'Daily habits record updated successfully'}), 200
    except Exception as e:
        app.logger.exception(f"An unexpected error occurred while updating daily habits for {employee_id}: {e}")
        return jsonify({'detail': 'Internal Server Error'}), 500

# --- Mental Health Logs API Endpoints ---
@app.route('/api/wellness/mental-health-logs/<employee_id>', methods=['GET'])
@jwt_required(locations=["cookies"])
def get_mental_health_logs(employee_id):
    """Fetches a specific user's mental health logs."""
    jwt_payload = get_jwt()
    user_info = jwt_payload.get("user_info")
    if user_info.get('role') != 'admin' and user_info.get('employeeId') != employee_id:
        return jsonify({'detail': 'Forbidden: You can only view your own mental health logs.'}), 403

    try:
        # For simplicity, we'll store one log per day, so find the latest one for today
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        log_record = mental_health_logs_collection.find_one(
            {'employeeId': employee_id, 'date': {'$gte': today_start.isoformat()}},
            sort=[('date', -1)]
        )
        if not log_record:
            return jsonify({'detail': 'Mental health log not found for today'}), 404
        log_record['id'] = str(log_record['_id'])
        del log_record['_id']
        return jsonify(log_record), 200
    except Exception as e:
        app.logger.exception(f"An unexpected error occurred while fetching mental health logs for {employee_id}: {e}")
        return jsonify({'detail': 'Internal Server Error'}), 500


@app.route('/api/wellness/mental-health-logs', methods=['POST'])
@jwt_required(locations=["cookies"])
def add_mental_health_log():
    """Adds a new mental health log record."""
    jwt_payload = get_jwt()
    user_info = jwt_payload.get("user_info")
    new_log = request.get_json()

    if not new_log or 'employeeId' not in new_log:
        return jsonify({'detail': 'Missing mental health log data or employeeId'}), 400

    if user_info.get('role') != 'admin' and user_info.get('employeeId') != new_log['employeeId']:
        return jsonify({'detail': 'Forbidden: You can only add your own mental health logs.'}), 403

    # For simplicity, prevent adding multiple logs for the same employee on the same day
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    if mental_health_logs_collection.find_one({'employeeId': new_log['employeeId'], 'date': {'$gte': today_start.isoformat()}}):
        return jsonify({'detail': 'Mental health log already exists for this employee today. Please update instead.'}), 409

    try:
        if 'id' in new_log:
            del new_log['id']
        new_log['date'] = datetime.now(timezone.utc).isoformat() # Ensure date is set by backend
        result = mental_health_logs_collection.insert_one(new_log)
        new_log['id'] = str(result.inserted_id)
        return jsonify(new_log), 201
    except Exception as e:
        app.logger.exception(f"An unexpected error occurred while adding a mental health log: {e}")
        return jsonify({'detail': 'Internal Server Error'}), 500

@app.route('/api/wellness/mental-health-logs/<employee_id>', methods=['PUT'])
@jwt_required(locations=["cookies"])
def update_mental_health_log(employee_id):
    """Updates an existing mental health log for a given employeeId for today."""
    jwt_payload = get_jwt()
    user_info = jwt_payload.get("user_info")
    updated_data = request.get_json()

    if not updated_data:
        return jsonify({'detail': 'Missing update data'}), 400

    if user_info.get('role') != 'admin' and user_info.get('employeeId') != employee_id:
        return jsonify({'detail': 'Forbidden: You can only update your own mental health logs.'}), 403

    if 'id' in updated_data:
        del updated_data['id']
    
    # Only update today's log
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    try:
        result = mental_health_logs_collection.update_one(
            {'employeeId': employee_id, 'date': {'$gte': today_start.isoformat()}},
            {'$set': updated_data}
        )
        if result.matched_count == 0:
            return jsonify({'detail': 'Mental health log not found for today'}), 404
        return jsonify({'detail': 'Mental health log updated successfully'}), 200
    except Exception as e:
        app.logger.exception(f"An unexpected error occurred while updating mental health log for {employee_id}: {e}")
        return jsonify({'detail': 'Internal Server Error'}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)