import sqlite3
import os
import joblib
import pandas as pd
import numpy as np

DATABASE = 'database.db'
MODEL_DIR = 'model_data'

# Dummy patient data
patients = [
    {
        "name": "Sarah Connor",
        "pregnancies": 2,
        "glucose": 148.0,
        "blood_pressure": 72.0,
        "skin_thickness": 35.0,
        "insulin": 0.0,
        "bmi": 33.6,
        "diabetes_pedigree_function": 0.627,
        "age": 50
    },
    {
        "name": "Devanshu Talreja",
        "pregnancies": 0,
        "glucose": 85.0,
        "blood_pressure": 66.0,
        "skin_thickness": 29.0,
        "insulin": 0.0,
        "bmi": 26.6,
        "diabetes_pedigree_function": 0.351,
        "age": 22
    },
    {
        "name": "John Miller",
        "pregnancies": 1,
        "glucose": 89.0,
        "blood_pressure": 66.0,
        "skin_thickness": 23.0,
        "insulin": 94.0,
        "bmi": 28.1,
        "diabetes_pedigree_function": 0.167,
        "age": 21
    },
    {
        "name": "Emma Watson",
        "pregnancies": 8,
        "glucose": 183.0,
        "blood_pressure": 64.0,
        "skin_thickness": 0.0,
        "insulin": 0.0,
        "bmi": 23.3,
        "diabetes_pedigree_function": 0.672,
        "age": 32
    },
    {
        "name": "Robert Downey",
        "pregnancies": 0,
        "glucose": 137.0,
        "blood_pressure": 40.0,
        "skin_thickness": 35.0,
        "insulin": 168.0,
        "bmi": 43.1,
        "diabetes_pedigree_function": 2.288,
        "age": 33
    },
    {
        "name": "Jane Austen",
        "pregnancies": 5,
        "glucose": 116.0,
        "blood_pressure": 74.0,
        "skin_thickness": 0.0,
        "insulin": 0.0,
        "bmi": 25.6,
        "diabetes_pedigree_function": 0.201,
        "age": 30
    },
    {
        "name": "David Beckham",
        "pregnancies": 3,
        "glucose": 78.0,
        "blood_pressure": 50.0,
        "skin_thickness": 32.0,
        "insulin": 88.0,
        "bmi": 31.0,
        "diabetes_pedigree_function": 0.248,
        "age": 26
    },
    {
        "name": "Ada Lovelace",
        "pregnancies": 10,
        "glucose": 115.0,
        "blood_pressure": 0.0,
        "skin_thickness": 0.0,
        "insulin": 0.0,
        "bmi": 35.3,
        "diabetes_pedigree_function": 0.134,
        "age": 29
    }
]

def main():
    print("Seeding database...")
    
    # Load ML components
    if not os.path.exists(os.path.join(MODEL_DIR, 'model.pkl')):
        print("Error: Train the model first.")
        return
        
    model = joblib.load(os.path.join(MODEL_DIR, 'model.pkl'))
    scaler = joblib.load(os.path.join(MODEL_DIR, 'scaler.pkl'))
    imputer = joblib.load(os.path.join(MODEL_DIR, 'imputer.pkl'))
    
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Create table if not exists
    cursor.execute('''
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
    
    # Clear existing data to avoid duplicate seeds
    cursor.execute("DELETE FROM predictions")
    
    feature_names = ['Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age']
    
    for p in patients:
        input_data = pd.DataFrame([[
            p["pregnancies"], p["glucose"], p["blood_pressure"], 
            p["skin_thickness"], p["insulin"], p["bmi"], 
            p["diabetes_pedigree_function"], p["age"]
        ]], columns=feature_names)
        
        # Preprocessing
        zero_columns = ["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI"]
        for col in zero_columns:
            if input_data.loc[0, col] == 0:
                input_data.loc[0, col] = np.nan
                
        # Transform inputs
        imputed_data = imputer.transform(input_data)
        scaled_data = scaler.transform(imputed_data)
        
        # Predict outcome and probability
        prediction = int(model.predict(scaled_data)[0])
        probability = float(model.predict_proba(scaled_data)[0][1])
        
        cursor.execute('''
            INSERT INTO predictions (
                name, pregnancies, glucose, blood_pressure, skin_thickness, insulin, bmi, diabetes_pedigree_function, age, prediction, probability
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            p["name"], p["pregnancies"], p["glucose"], p["blood_pressure"], 
            p["skin_thickness"], p["insulin"], p["bmi"], 
            p["diabetes_pedigree_function"], p["age"], prediction, probability
        ))
        
    conn.commit()
    conn.close()
    print("Database successfully seeded with 8 patients!")

if __name__ == "__main__":
    main()
