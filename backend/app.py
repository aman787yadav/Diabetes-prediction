import os
import json
import sqlite3
import numpy as np
import pandas as pd
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # Enable CORS for React frontend integration

DATABASE = 'database.db'
MODEL_DIR = 'model_data'

# Load ML components
try:
    model = joblib.load(os.path.join(MODEL_DIR, 'model.pkl'))
    scaler = joblib.load(os.path.join(MODEL_DIR, 'scaler.pkl'))
    imputer = joblib.load(os.path.join(MODEL_DIR, 'imputer.pkl'))
    print("Successfully loaded ML models and scalers.")
except Exception as e:
    print(f"Error loading ML components: {e}")
    model, scaler, imputer = None, None, None

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            pregnancies INTEGER,
            glucose REAL,
            blood_pressure REAL,
            skin_thickness REAL,
            insulin REAL,
            bmi REAL,
            diabetes_pedigree_function REAL,
            age INTEGER,
            prediction INTEGER,
            probability REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()
    print("Database initialized.")

# Initialize DB on start
init_db()

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    try:
        with open(os.path.join(MODEL_DIR, 'metrics.json'), 'r') as f:
            metrics = json.load(f)
        return jsonify(metrics), 200
    except Exception as e:
        return jsonify({"error": f"Could not load metrics: {str(e)}"}), 500

@app.route('/api/predict', methods=['POST'])
def predict():
    if not model or not scaler or not imputer:
        return jsonify({"error": "ML model is not loaded on the server."}), 500
        
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
        
    try:
        # Extract inputs
        name = data.get('name', 'Anonymous Patient')
        pregnancies = float(data.get('pregnancies', 0))
        glucose = float(data.get('glucose', 0))
        blood_pressure = float(data.get('blood_pressure', 0))
        skin_thickness = float(data.get('skin_thickness', 0))
        insulin = float(data.get('insulin', 0))
        bmi = float(data.get('bmi', 0))
        diabetes_pedigree_function = float(data.get('diabetes_pedigree_function', 0))
        age = float(data.get('age', 0))
        
        # Prepare data for prediction
        # The training features are: Pregnancies, Glucose, BloodPressure, SkinThickness, Insulin, BMI, DiabetesPedigreeFunction, Age
        feature_names = ['Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age']
        input_data = pd.DataFrame([[pregnancies, glucose, blood_pressure, skin_thickness, insulin, bmi, diabetes_pedigree_function, age]], columns=feature_names)
        
        # In preprocessing, 0 values for these columns are treated as NaN for imputation
        zero_columns = ["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI"]
        for col in zero_columns:
            if input_data.loc[0, col] == 0:
                input_data.loc[0, col] = np.nan
                
        # Transform inputs using loaded imputer and scaler
        imputed_data = imputer.transform(input_data)
        scaled_data = scaler.transform(imputed_data)
        
        # Predict outcome and probability
        prediction = int(model.predict(scaled_data)[0])
        probability = float(model.predict_proba(scaled_data)[0][1])
        
        # Save to database
        conn = get_db_connection()
        conn.execute('''
            INSERT INTO predictions (
                name, pregnancies, glucose, blood_pressure, skin_thickness, insulin, bmi, diabetes_pedigree_function, age, prediction, probability
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            name, pregnancies, glucose, blood_pressure, skin_thickness, insulin, bmi, diabetes_pedigree_function, age, prediction, probability
        ))
        conn.commit()
        conn.close()
        
        # Dynamic medical insights explanation
        insights = []
        if glucose > 140:
            insights.append("Elevated blood glucose concentration suggests possible hyperglycemia.")
        if bmi > 30:
            insights.append("Body Mass Index indicates obesity, which increases insulin resistance.")
        if age > 45:
            insights.append("Age above 45 is a known risk factor for Type 2 diabetes.")
        if diabetes_pedigree_function > 0.5:
            insights.append("High Diabetes Pedigree Score indicates a strong genetic predisposition.")
            
        if not insights:
            insights.append("Clinical parameters are largely within standard reference ranges.")

        return jsonify({
            "name": name,
            "prediction": prediction,
            "probability": round(probability, 4),
            "insights": insights
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 400

@app.route('/api/history', methods=['GET'])
def get_history():
    try:
        conn = get_db_connection()
        rows = conn.execute('SELECT * FROM predictions ORDER BY created_at DESC').fetchall()
        conn.close()
        
        history = []
        for row in rows:
            history.append({
                "id": row['id'],
                "name": row['name'],
                "pregnancies": row['pregnancies'],
                "glucose": row['glucose'],
                "blood_pressure": row['blood_pressure'],
                "skin_thickness": row['skin_thickness'],
                "insulin": row['insulin'],
                "bmi": row['bmi'],
                "diabetes_pedigree_function": row['diabetes_pedigree_function'],
                "age": row['age'],
                "prediction": row['prediction'],
                "probability": round(row['probability'], 4),
                "created_at": row['created_at']
            })
            
        return jsonify(history), 200
    except Exception as e:
        return jsonify({"error": f"Could not fetch history: {str(e)}"}), 500

@app.route('/api/history/<int:record_id>', methods=['DELETE'])
def delete_history(record_id):
    try:
        conn = get_db_connection()
        cursor = conn.execute('DELETE FROM predictions WHERE id = ?', (record_id,))
        conn.commit()
        changes = cursor.rowcount
        conn.close()
        
        if changes == 0:
            return jsonify({"error": "Record not found"}), 404
            
        return jsonify({"message": "Record deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": f"Could not delete record: {str(e)}"}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        conn = get_db_connection()
        
        # Basic counts
        total = conn.execute('SELECT COUNT(*) FROM predictions').fetchone()[0]
        diabetic = conn.execute('SELECT COUNT(*) FROM predictions WHERE prediction = 1').fetchone()[0]
        non_diabetic = conn.execute('SELECT COUNT(*) FROM predictions WHERE prediction = 0').fetchone()[0]
        
        # Averages by prediction class
        avg_diabetic = conn.execute('''
            SELECT AVG(glucose) as avg_glucose, AVG(bmi) as avg_bmi, AVG(blood_pressure) as avg_bp, AVG(age) as avg_age 
            FROM predictions WHERE prediction = 1
        ''').fetchone()
        
        avg_non_diabetic = conn.execute('''
            SELECT AVG(glucose) as avg_glucose, AVG(bmi) as avg_bmi, AVG(blood_pressure) as avg_bp, AVG(age) as avg_age 
            FROM predictions WHERE prediction = 0
        ''').fetchone()
        
        # Distribution by Age groups: <30, 30-45, 45-60, 60+
        age_dist = conn.execute('''
            SELECT 
                SUM(CASE WHEN age < 30 THEN 1 ELSE 0 END) as under_30,
                SUM(CASE WHEN age >= 30 AND age < 45 THEN 1 ELSE 0 END) as age_30_45,
                SUM(CASE WHEN age >= 45 AND age < 60 THEN 1 ELSE 0 END) as age_45_60,
                SUM(CASE WHEN age >= 60 THEN 1 ELSE 0 END) as over_60
            FROM predictions
        ''').fetchone()
        
        conn.close()
        
        # Helper to format None values
        def format_avg(val):
            return round(val, 2) if val is not None else 0.0
            
        stats = {
            "total_predictions": total,
            "diabetic_count": diabetic,
            "non_diabetic_count": non_diabetic,
            "averages": {
                "diabetic": {
                    "glucose": format_avg(avg_diabetic['avg_glucose']),
                    "bmi": format_avg(avg_diabetic['avg_bmi']),
                    "blood_pressure": format_avg(avg_diabetic['avg_bp']),
                    "age": format_avg(avg_diabetic['avg_age'])
                },
                "non_diabetic": {
                    "glucose": format_avg(avg_non_diabetic['avg_glucose']),
                    "bmi": format_avg(avg_non_diabetic['avg_bmi']),
                    "blood_pressure": format_avg(avg_non_diabetic['avg_bp']),
                    "age": format_avg(avg_non_diabetic['avg_age'])
                }
            },
            "age_groups": {
                "under_30": age_dist['under_30'] or 0,
                "age_30_45": age_dist['age_30_45'] or 0,
                "age_45_60": age_dist['age_45_60'] or 0,
                "over_60": age_dist['over_60'] or 0
            }
        }
        
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({"error": f"Could not fetch stats: {str(e)}"}), 500

if __name__ == '__main__':
    # Render (and other cloud providers) provide the port via the PORT environment variable.
    # Default to 5000 for local development.
    port = int(os.getenv('PORT', '5000'))
    # Bind to all interfaces so the service is reachable externally.
    host = os.getenv('HOST', '0.0.0.0')
    # Enable debug mode based on environment variable for safety in production.
    debug_mode = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(host=host, port=port, debug=debug_mode)
