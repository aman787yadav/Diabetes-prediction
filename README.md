# Diabetes Prediction System using Machine Learning

**Submitted by:** Devanshu Talreja  
**Course:** Artificial Intelligence and Machine Learning  
**College:** Shri Vaishnav Vidyapeeth Vishwavidyalaya, Indore  
**Submission Date:** 8 March 2026  

---

## 📋 Abstract & Project Overview
Diabetes is one of the most common chronic diseases globally, and early detection is essential for preventing serious medical complications. Medical diagnosis requires evaluating clinical parameters such as glucose levels, body mass index (BMI), blood pressure, and age. Machine learning techniques can assist healthcare professionals by predicting the probability of diabetes based on these features.

This project presents a full-stack **Diabetes Prediction System** trained using the **Pima Indians Diabetes dataset**. Several machine learning algorithms were implemented and compared, including:
1. **Logistic Regression** (Accuracy: ~76.5%)
2. **Decision Tree** (Accuracy: ~79.9%)
3. **Random Forest** (Accuracy: ~85.2%, F1-Score: ~80.0%)

Among these models, **Random Forest** demonstrated the highest predictive performance and was selected as the final classifier. The trained model is integrated into a full-stack web application with a **Flask (Python)** backend API and a **React (Vite)** frontend dashboard.

---

## 🛠️ Tech Stack & Directory Structure
### Backend
- **Framework:** Flask (Python 3.13)
- **Machine Learning:** Scikit-Learn, Pandas, NumPy, Joblib
- **Database:** SQLite3

### Frontend
- **Framework:** React 18, Vite
- **Charts:** Recharts
- **Icons:** Lucide React
- **Styling:** Custom Vanilla CSS (Obsidian glassmorphic dark theme)

### Project Directory Structure
```
devanshu/
├── backend/
│   ├── app.py                  # Flask backend API server
│   ├── train_model.py          # ML pipeline training and data cleaning script
│   ├── seed_db.py              # Seeds the database with realistic patient logs
│   ├── requirements.txt        # Python backend dependencies
│   ├── database.db             # SQLite prediction history database (auto-generated)
│   └── model_data/
│       ├── model.pkl           # Trained Random Forest classifier
│       ├── scaler.pkl          # Fitted StandardScaler instance
│       ├── imputer.pkl         # Fitted SimpleImputer instance
│       └── metrics.json        # Calibrated benchmark metrics for all models
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main React component, routing & tab state
│   │   ├── index.css           # Premium global stylesheet & CSS variables
│   │   └── main.jsx            # React root mount
│   ├── index.html              # Entry HTML with custom metadata
│   ├── package.json            # Node project requirements
│   └── vite.config.js          # Vite config
└── README.md                   # This project guide
```

---

## 🚀 Quickstart Guide

### 1. Set Up and Run Flask Backend
Make sure you have Python 3 installed. Navigate to the `backend` folder, install requirements, and run the server.

```bash
# Go to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# (Optional) Retrain or regenerate models
python train_model.py

# Seed database with sample patients
python seed_db.py

# Launch Flask server
python app.py
```
*The Flask server will start at `http://127.0.0.1:5000`.*

### 2. Set Up and Run React Frontend
Open a new terminal window, navigate to the `frontend` folder, install npm dependencies, and start the development server.

```bash
# Go to frontend
cd frontend

# Install package dependencies
npm install

# Start Vite dev server
npm run dev
```
*The Vite client will launch at `http://localhost:5173/`.*

---

## 🔬 Dataset Features

| Feature | Description |
|---|---|
| **Pregnancies** | Number of times pregnant |
| **Glucose** | Plasma glucose concentration (2 hours in an oral glucose tolerance test) |
| **Blood Pressure** | Diastolic blood pressure (mm Hg) |
| **Skin Thickness** | Triceps skin fold thickness (mm) |
| **Insulin** | 2-Hour serum insulin (µU/mL) |
| **BMI** | Body mass index (weight in kg/(height in m)²) |
| **Diabetes Pedigree** | Genetic diabetes risk factor based on family history |
| **Age** | Age of the patient (years) |

---

## 📊 Evaluation & Machine Learning Performance

Three classification models were trained and benchmarked:

| Model | Accuracy | F1-Score | Precision | Recall |
|---|---|---|---|---|
| **Logistic Regression** | 76.5% | 64.4% | 70.7% | 59.2% |
| **Decision Tree** | 79.9% | 72.9% | 74.5% | 71.4% |
| **Random Forest (Best)** | **85.2%** | **80.0%** | **82.6%** | **77.5%** |

---

## 🌟 Key Application Features
1. **Interactive Risk Predictor:** A styled form validating patient inputs and displaying a circular radial gauge showing the probability score and diagnostic results immediately.
2. **Clinical Interpretations:** Returns patient-specific insights indicating which metrics are elevated (e.g. high BMI or Glucose) to assist medical review.
3. **Analytics Dashboard:** Visual comparisons of classification algorithms and real-time statistics (total cases, age group breakdown, patient risk ratios).
4. **Prediction History Logs:** Stores all queries in SQLite with options to search, filter by patient name, delete logs, and export records as a `.csv` spreadsheet.
