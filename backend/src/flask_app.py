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
import cloudpickle

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

    with open(os.path.join(MODELS_DIR, "wellness_recommendation_engine.pkl"), "rb") as f:
        recommendation_engine = cloudpickle.load(f)
        
    app.logger.info("All ML models and functional recommendation engines loaded successfully.")

except Exception as e:
    app.logger.error(f"Error loading ML model: {e}")
    risk_model = None
    target_encoder = None
    feature_columns = None
    recommendation_engine = None
    
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
    normalized = {
        "age": int(record.get("age", 30) or 30),
        "gender": record.get("gender", "Male") or "Male",
        "height_cm": float(record.get("heightCm", 170) or 170),
        "weight_kg": float(record.get("weightKg", 70) or 70),
        "bmi": float(record.get("bmi", 24.0) or 24.0),
        "blood_pressure_systolic": int(record.get("bloodPressureSystolic", 120) or 120),
        "blood_pressure_diastolic": int(record.get("bloodPressureDiastolic", 80) or 80),
        "exercise_days_per_week": int(record.get("exerciseDaysPerWeek", 0) or 0),
        "sleep_hours": float(record.get("sleepHoursPerNight", 7.0) or 7.0),
        "stress_score": int(record.get("stressScore", 5) or 5),
        "attendance_percent": float(record.get("attendanceRate", 95) or 95),
        "glucose_level": float(record.get("glucoseLevel", 90) or 90),
        "smoker": record.get("smoker", False),
        "alcohol_use": record.get("alcoholUse", False),
        "medical_condition": record.get("medicalCondition", "No major condition") or "No major condition",
    }

    df = pd.DataFrame([normalized])

    categorical_cols = [col for col in ["gender", "medical_condition"] if col in df.columns]
    df = pd.get_dummies(df, columns=categorical_cols, drop_first=True)

    df = df.reindex(columns=feature_columns, fill_value=0)
    return df

@app.route('/api/wellness/risks', methods=['GET'])
@jwt_required(locations=["cookies"])
def get_risk_predictions():
    if risk_model is None or target_encoder is None or feature_columns is None:
        return jsonify({"detail": "ML model artifacts are not loaded on the server."}), 500

    try:
        records_cursor = health_records_collection.find({})
        results = []

        for record in records_cursor:
            try:
                employee_id = record.get("employeeId")
                employee_name = record.get("employeeName", "Unknown Employee")

                model_input_df = map_health_record_to_model_input(record)

                encoded_pred = risk_model.predict(model_input_df)[0]
                risk_label = target_encoder.inverse_transform([encoded_pred])[0]

                if hasattr(risk_model, "predict_proba"):
                    # Extract probabilities for specific classes safely
                    risk_probabilities = risk_model.predict_proba(model_input_df)[0]
                    class_labels = target_encoder.classes_
                    prob_dict = dict(zip(class_labels, risk_probabilities))

                    # Map the score appropriately based on the true prediction label
                    if risk_label == "High":
                        risk_score = round(70 + (prob_dict.get("High", 0.7) * 30))
                    elif risk_label == "Medium":
                        risk_score = round(45 + (prob_dict.get("Medium", 0.5) * 24))
                    else: # Low risk
                        risk_score = round(prob_dict.get("Low", 0.1) * 44)
                else:
                    risk_score = 50 # Fallback score

                factors = []
                if model_input_df.get("stress_score", pd.Series([0])).iloc[0] >= 7:
                    factors.append("High stress score")
                if model_input_df.get("sleep_hours", pd.Series([0])).iloc[0] < 6:
                    factors.append("Insufficient sleep")
                if model_input_df.get("bmi", pd.Series([0])).iloc[0] >= 30:
                    factors.append("High BMI")
                if (
                    model_input_df.get("blood_pressure_systolic", pd.Series([0])).iloc[0] >= 140
                    or model_input_df.get("blood_pressure_diastolic", pd.Series([0])).iloc[0] >= 90
                ):
                    factors.append("Elevated blood pressure")
                if model_input_df.get("exercise_days_per_week", pd.Series([0])).iloc[0] <= 1:
                    factors.append("Low weekly exercise")
                if model_input_df.get("glucose_level", pd.Series([0])).iloc[0] >= 126:
                    factors.append("Elevated glucose level")

                if risk_label == "High":
                    recommendation_action = "Immediate clinical review, stress intervention, and close vitals monitoring recommended."
                elif risk_label == "Medium":
                    recommendation_action = "Moderate risk detected. Improve sleep, exercise, and review biometric trends weekly."
                else:
                    recommendation_action = "Low risk profile. Maintain current healthy routines and continue periodic monitoring."

                results.append({
                    "employeeId": employee_id,
                    "employeeName": employee_name,
                    "riskType": risk_label,
                    "riskScore": risk_score,
                    "factors": factors if factors else ["Vitals check within ideal levels"],
                    "recommendationAction": recommendation_action
                })

            except Exception as row_error:
                app.logger.exception(
                    "Risk prediction failed for employeeId=%s: %s",
                    record.get("employeeId"),
                    str(row_error)
                )
                results.append({
                    "employeeId": record.get("employeeId"),
                    "employeeName": record.get("employeeName"),
                    "riskType": "Unknown",
                    "riskScore": 0,
                    "factors": [f"Prediction failed: {str(row_error)}"],
                    "recommendationAction": "Review this employee's health record fields."
                })

        results.sort(key=lambda item: item["riskScore"], reverse=True)
        return jsonify(results), 200

    except Exception as e:
        app.logger.exception(f"Failed to generate wellness risks: {e}")
        return jsonify({"detail": "Risk prediction failed"}), 500


@app.route('/api/wellness/risks_old', methods=['GET'])
@jwt_required(locations=["cookies"])
def get_wellness_risks_old():
    if risk_model is None or target_encoder is None or feature_columns is None:
        return jsonify({'detail': 'ML model is not available.'}), 503

    try:
        health_records = list(health_records_collection.find({}))
        if not health_records:
            return jsonify([]), 200

        risk_profiles = []

        for record in health_records:
            try:
                model_input_df = map_health_record_to_model_input(record)

                prediction_encoded = risk_model.predict(model_input_df)
                prediction_label = target_encoder.inverse_transform(prediction_encoded)[0]

                risk_score = 25
                if prediction_label == 'High':
                    risk_score = 80
                elif prediction_label == 'Medium':
                    risk_score = 55

                risk_profiles.append({
                    "employeeId": record.get("employeeId"),
                    "employeeName": record.get("employeeName"),
                    "riskType": prediction_label,
                    "riskScore": risk_score,
                    "factors": [f"Predicted as {prediction_label} risk by model."],
                    "recommendationAction": f"Follow standard protocol for {prediction_label} risk employees."
                })

            except Exception as row_error:
                app.logger.exception(
                    "Risk prediction failed for employeeId=%s: %s",
                    record.get("employeeId"),
                    str(row_error)
                )

                risk_profiles.append({
                    "employeeId": record.get("employeeId"),
                    "employeeName": record.get("employeeName"),
                    "riskType": "Unknown",
                    "riskScore": 0,
                    "factors": [f"Prediction failed: {str(row_error)}"],
                    "recommendationAction": "Review this employee's health record fields."
                })

        return jsonify(risk_profiles), 200

    except Exception as e:
        app.logger.exception(f"An unexpected error occurred during risk prediction: {e}")
        return jsonify({'detail': 'Internal Server Error'}), 500

@app.route('/api/wellness/recommendations', methods=['GET'])
@jwt_required(locations=["cookies"])
def get_recommendations():
    if risk_model is None:
        return jsonify({"detail": "Risk prediction model is not available."}), 503

    try:
        health_records = list(health_records_collection.find({}))
        if not health_records:
            return jsonify([]), 200

        all_recommendations = []

        for record in health_records:
            try:
                # 1. Get risk profile from the classification model
                model_input_df = map_health_record_to_model_input(record)
                encoded_pred = risk_model.predict(model_input_df)[0]
                risk_label = target_encoder.inverse_transform([encoded_pred])[0]

                # 2. Extract and sanitize values with safe defaults to prevent engine float/string casting crashes
                employee_profile = {
                    "bmi": float(record.get("bmi") if record.get("bmi") is not None else 24.0),
                    "sleepHoursPerNight": float(record.get("sleepHoursPerNight") if record.get("sleepHoursPerNight") is not None else 7.0),
                    "exercise_days_per_week": float(record.get("exerciseDaysPerWeek") if record.get("exerciseDaysPerWeek") is not None else record.get("exercise_days_per_week", 3.0)),
                    "stress_score": float(record.get("stressScore") if record.get("stressScore") is not None else record.get("stress_score", 5.0)),
                    "blood_pressure_systolic": float(record.get("bloodPressureSystolic") if record.get("bloodPressureSystolic") is not None else record.get("blood_pressure_systolic", 120.0)),
                    "blood_pressure_diastolic": float(record.get("bloodPressureDiastolic") if record.get("bloodPressureDiastolic") is not None else record.get("blood_pressure_diastolic", 80.0)),
                    "glucose_level": float(record.get("glucoseLevel") if record.get("glucose_level") is not None else record.get("glucose_level", 90.0)),
                    "attendance_percent": float(record.get("attendanceRate") if record.get("attendanceRate") is not None else record.get("attendance_percent", 95.0)),
                    "medical_condition": str(record.get("medicalCondition") if record.get("medicalCondition") is not None else record.get("medical_condition", "none")),
                    "smoker": record.get("smoker", False),
                    "alcohol_use": record.get("alcoholUse", record.get("alcohol_use", False)),
                    "risk_label": str(risk_label)
                }

                # 3. Use the loaded recommendation engine if available
                if recommendation_engine is not None:
                    top_recs = recommendation_engine(employee_profile, top_n=3)
                
                # 4. Fallback: Exact structural mirror matching the engine's output dictionary format
                else:
                    top_recs = []
                    
                    if employee_profile["stress_score"] >= 8:
                        top_recs.append({
                            "recommendation_id": "REC002",
                            "title": "Guided Meditation Routine",
                            "category": "Mental Wellness",
                            "description": "10-15 minutes of guided meditation and breathing exercises daily.",
                            "score": 9.0,
                            "reasons": ["Stress score is very high"]
                        })
                    elif employee_profile["stress_score"] >= 5:
                        top_recs.append({
                            "recommendation_id": "REC006",
                            "title": "Desk Yoga and Stretching",
                            "category": "Yoga",
                            "description": "Short guided desk yoga sessions to reduce stiffness and stress.",
                            "score": 6.0,
                            "reasons": ["Stress score is moderately elevated"]
                        })

                    if employee_profile["sleepHoursPerNight"] < 6:
                        top_recs.append({
                            "recommendation_id": "REC003",
                            "title": "Sleep Hygiene Program",
                            "category": "Lifestyle",
                            "description": "Consistent bedtime, reduced screen time, and sleep-friendly habits.",
                            "score": 8.5,
                            "reasons": ["Sleep hours are below healthy range"]
                        })

                    if employee_profile["exercise_days_per_week"] <= 2 or employee_profile["bmi"] >= 30:
                        top_recs.append({
                            "recommendation_id": "REC001",
                            "title": "Brisk Walking Plan",
                            "category": "Fitness",
                            "description": "30-minute brisk walking, 5 days a week, with gradual progression.",
                            "score": 7.0,
                            "reasons": ["Exercise frequency is low"]
                        })

                    # Fallback baseline when no risk boundaries are crossed
                    if not top_recs:
                        top_recs.append({
                            "recommendation_id": "REC_BASE",
                            "title": "Wellness Maintenance Plan",
                            "category": "Lifestyle",
                            "description": "Great job! Maintain your current hydration, healthy routines, and sleep patterns.",
                            "score": 3.0,
                            "reasons": ["Matches baseline health checks"]
                        })

                    top_recs = top_recs[:3]

                all_recommendations.append({
                    "employeeId": record.get("employeeId"),
                    "employeeName": record.get("employeeName"),
                    "riskProfile": {"riskType": risk_label},
                    "recommendations": top_recs
                })

            except Exception as e:
                app.logger.error(f"Failed to generate recommendations for {record.get('employeeId')}: {e}")

        return jsonify(all_recommendations), 200

    except Exception as e:
        app.logger.exception(f"An unexpected error occurred while generating recommendations: {e}")
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

@app.route('/api/wellness/sentiments', methods=['GET'])
@jwt_required(locations=["cookies"])
def get_sentiments():
    """ Fetches department sentiment summary. Admin-only endpoint. """
    jwt_payload = get_jwt()
    user_info = jwt_payload.get("user_info")
    if not user_info or user_info.get('role') != 'admin':
        return jsonify({'detail': 'Forbidden: You do not have permission to access this resource.'}), 403

    try:
        DEPT_SUMMARY_PATH = os.path.join(BASE_DIR, "outputs", "department_stress_summary.csv")
        FEEDBACK_DATA_PATH = os.path.join(BASE_DIR, "data", "dataset", "employee_feedback.csv")

        if not os.path.exists(DEPT_SUMMARY_PATH) or not os.path.exists(FEEDBACK_DATA_PATH):
            app.logger.warning("Department summary or feedback CSV not found. Returning empty list.")
            return jsonify([]), 200

        summary_df = pd.read_csv(DEPT_SUMMARY_PATH)
        feedback_df = pd.read_csv(FEEDBACK_DATA_PATH)

        # Extract top 3 key issues per department from the raw feedback
        key_issues = feedback_df[feedback_df['sentiment'] == 'Negative'].groupby('department')['feedback_text'].apply(
            # Use a lambda to get unique items before slicing
            lambda x: list(pd.Series(x).unique())[:3]
        ).to_dict()

        results = []
        for _, row in summary_df.iterrows():
            total = row['total_feedback']
            neg_count = row['negative_feedback_count']
            # Approximate positive and neutral counts for distribution
            pos_count = total - neg_count - row['medium_stress_count'] 
            neu_count = row['medium_stress_count']

            results.append({
                "department": row['department'],
                "averageStressScore": round(row['avg_compound_sentiment'] * -10 + 5, 1), # Scale to 1-10
                "sentimentDistribution": {
                    "positive": round((pos_count / total) * 100) if total > 0 else 0,
                    "neutral": round((neu_count / total) * 100) if total > 0 else 0,
                    "negative": round((neg_count / total) * 100) if total > 0 else 0,
                },
                "keyIssues": key_issues.get(row['department'], ["No specific issues logged"]),
                "recentFeedbackCount": int(row['total_feedback'])
            })
        return jsonify(results), 200
    except Exception as e:
        app.logger.exception(f"An unexpected error occurred while fetching sentiments: {e}")
        return jsonify({'detail': 'Internal Server Error'}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)