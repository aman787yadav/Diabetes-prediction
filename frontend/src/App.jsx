import { useState, useEffect } from 'react';
import {
  Activity, Heart, User, Calendar, Table, LineChart,
  Home, Database, Brain, Trash2, Download, AlertTriangle,
  CheckCircle, TrendingUp, Droplet, PlusCircle, Search,
  FileText, Award, Scale, HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Legend, CartesianGrid, PieChart, Pie, Cell
} from 'recharts';

const API_BASE = 'https://diabetes-prediction-ikom.onrender.com/api';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [history, setHistory] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState({ history: true, metrics: true, stats: true });
  const [backendError, setBackendError] = useState(null);

  // Predict Form State
  const [formData, setFormData] = useState({
    name: '',
    pregnancies: '',
    glucose: '',
    blood_pressure: '',
    skin_thickness: '',
    insulin: '',
    bmi: '',
    diabetes_pedigree_function: '',
    age: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictResult, setPredictResult] = useState(null);

  // Search History State
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all backend data
  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/history`);
      if (!res.ok) throw new Error('Failed to load history');
      const data = await res.json();
      setHistory(data);
      setBackendError(null);
    } catch (err) {
      console.error(err);
      setBackendError('Flask server offline. Please make sure the backend is running.');
    } finally {
      setLoading(prev => ({ ...prev, history: false }));
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${API_BASE}/metrics`);
      if (!res.ok) throw new Error('Failed to load metrics');
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, metrics: false }));
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      if (!res.ok) throw new Error('Failed to load stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  useEffect(() => {
  const init = async () => {
    await Promise.all([fetchHistory(), fetchMetrics(), fetchStats()]);
  };
  init();
}, []);

  // Handle Predict Submission
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error when typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Patient name is required';

    // Numeric checks
    const checkPositive = (val, name, label) => {
      if (val === '' || isNaN(val)) {
        errors[name] = `${label} must be a number`;
      } else if (Number(val) < 0) {
        errors[name] = `${label} cannot be negative`;
      }
    };

    checkPositive(formData.pregnancies, 'pregnancies', 'Pregnancies');
    checkPositive(formData.glucose, 'glucose', 'Glucose level');
    checkPositive(formData.blood_pressure, 'blood_pressure', 'Blood Pressure');
    checkPositive(formData.skin_thickness, 'skin_thickness', 'Skin Thickness');
    checkPositive(formData.insulin, 'insulin', 'Insulin level');
    checkPositive(formData.bmi, 'bmi', 'BMI');
    checkPositive(formData.diabetes_pedigree_function, 'diabetes_pedigree_function', 'Diabetes Pedigree Function');
    checkPositive(formData.age, 'age', 'Age');

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePredictSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setPredictLoading(true);
    setPredictResult(null);

    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Prediction failed');
      }

      const result = await res.json();
      setPredictResult(result);

      // Reset form fields except name for convenience
      setFormData({
        name: '',
        pregnancies: '',
        glucose: '',
        blood_pressure: '',
        skin_thickness: '',
        insulin: '',
        bmi: '',
        diabetes_pedigree_function: '',
        age: ''
      });

      // Refresh database tables & statistics
      fetchHistory();
      fetchStats();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setPredictLoading(false);
    }
  };

  // Handle Delete History
  const handleDeleteRecord = async (id) => {
    if (!window.confirm("Are you sure you want to delete this prediction record?")) return;
    try {
      const res = await fetch(`${API_BASE}/history/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Deletion failed');

      // Refresh
      fetchHistory();
      fetchStats();
    } catch (err) {
      alert(err.message);
    }
  };

  // Export History to CSV
  const handleExportCSV = () => {
    if (history.length === 0) return;

    const headers = [
      "ID", "Patient Name", "Pregnancies", "Glucose", "Blood Pressure",
      "Skin Thickness", "Insulin", "BMI", "Pedigree Score", "Age",
      "Prediction", "Probability", "Date Created"
    ];

    const rows = history.map(h => [
      h.id,
      `"${h.name.replace(/"/g, '""')}"`,
      h.pregnancies,
      h.glucose,
      h.blood_pressure,
      h.skin_thickness,
      h.insulin,
      h.bmi,
      h.diabetes_pedigree_function,
      h.age,
      h.prediction === 1 ? "Diabetic" : "Non-Diabetic",
      h.probability,
      h.created_at
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "diabetes_predictions_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Search filter
  const filteredHistory = history.filter(h =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-container">
      <div className="app-bg-glow"></div>

      {/* Sidebar Section */}
      <nav className="sidebar">
        <div>
          <div className="logo-section">
            <Activity className="logo-icon" size={28} />
            <span className="logo-text">DIABETES PREDICT</span>
          </div>

          <ul className="nav-links">
            <li>
              <div
                className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
                onClick={() => setActiveTab('home')}
              >
                <Home size={20} />
                <span>Home System</span>
              </div>
            </li>
            <li>
              <div
                className={`nav-item ${activeTab === 'predict' ? 'active' : ''}`}
                onClick={() => setActiveTab('predict')}
              >
                <Brain size={20} />
                <span>Risk Prediction</span>
              </div>
            </li>
            <li>
              <div
                className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <LineChart size={20} />
                <span>Analytics Stats</span>
              </div>
            </li>
            <li>
              <div
                className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <Table size={20} />
                <span>Prediction History</span>
              </div>
            </li>
          </ul>
        </div>

        <div className="sidebar-footer">
          <div className="author-card">
            <span className="author-title">Submitted By:</span>
            <span className="author-name">aman yadav</span>
            <span className="author-college">SVVV Indore</span>
            <span className="author-title" style={{ marginTop: '6px' }}>roll no.:- 2210DMBCSE12083</span>
          </div>
        </div>
      </nav>

      {/* Main Content Viewport */}
      <main className="main-content">
        {backendError && (
          <div className="card" style={{ borderColor: 'var(--color-diabetic-border)', backgroundColor: 'var(--color-diabetic-bg)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <AlertTriangle color="var(--color-diabetic)" size={28} />
            <div>
              <h4 style={{ color: 'var(--color-diabetic)', fontWeight: 600 }}>Backend Connection Issue</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{backendError}</p>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        {activeTab === 'home' && (
          <HomeView setActiveTab={setActiveTab} />
        )}

        {activeTab === 'predict' && (
          <PredictView
            formData={formData}
            formErrors={formErrors}
            handleInputChange={handleInputChange}
            handlePredictSubmit={handlePredictSubmit}
            predictLoading={predictLoading}
            predictResult={predictResult}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            metrics={metrics}
            stats={stats}
            loading={loading}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            history={filteredHistory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleDeleteRecord={handleDeleteRecord}
            handleExportCSV={handleExportCSV}
            loading={loading.history}
          />
        )}
      </main>
    </div>
  );
}

/* Sub-views */

// 1. Home / Project Introduction Page
function HomeView({ setActiveTab }) {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Diabetes Prediction Platform</h1>
        <p className="page-subtitle">Intelligent clinical risk profiling using advanced Machine Learning classifiers</p>
      </div>

      <div className="hero-banner">
        <div className="hero-content">
          <span className="hero-tag">AI & Healthcare</span>
          <h2 className="hero-title">Early Detection Can Save Lives.</h2>
          <p className="hero-desc">
            This platform uses diagnostic parameters to evaluate the probability of diabetes mellitus. Powered by a high-performing Random Forest model trained on the Pima Indians Dataset.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary" onClick={() => setActiveTab('predict')}>
              <Brain size={18} /> Start Prediction
            </button>
            <button className="btn btn-secondary" onClick={() => setActiveTab('dashboard')}>
              <LineChart size={18} /> View Analytics
            </button>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card abstract-card">
          <h3 className="section-title"><FileText size={22} className="logo-icon" /> Abstract</h3>
          <p className="abstract-text">
            Diabetes is one of the most common chronic diseases globally, and early detection is vital for preventing severe medical complications. This project implements a Diabetes Prediction System that analyzes patient parameters such as glucose, blood pressure, insulin, BMI, and age. Several machine learning models were developed—including Decision Tree, Logistic Regression, and Random Forest.
            <br /><br />
            <strong>Random Forest</strong> demonstrated the highest diagnostic classification performance, achieving an accuracy of approximately <strong>85%</strong> and an F1-score of <strong>80%</strong>. This predictive model is integrated into a modern web portal enabling real-time diagnostic reporting.
          </p>
        </div>

        <div className="card abstract-card">
          <h3 className="section-title"><Award size={22} className="logo-icon" /> Project Objectives</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="objective-item">
              <span className="objective-num">01</span>
              <span className="objective-text">Identify and study clinical features that heavily influence type-2 diabetes risk.</span>
            </div>
            <div className="objective-item">
              <span className="objective-num">02</span>
              <span className="objective-text">Clean and scale the clinical records using robust median-based imputer pipelines.</span>
            </div>
            <div className="objective-item">
              <span className="objective-num">03</span>
              <span className="objective-text">Train and optimize Decision Tree, Logistic Regression, and Random Forest models.</span>
            </div>
            <div className="objective-item">
              <span className="objective-num">04</span>
              <span className="objective-text">Deploy a full-stack Flask backend API to run real-time inference and log clinical history.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. Predict / Input Diagnostic Parameters Page
function PredictView({
  formData, formErrors, handleInputChange, handlePredictSubmit,
  predictLoading, predictResult
}) {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Patient Diagnostic Evaluation</h1>
        <p className="page-subtitle">Submit clinical parameters below to compute diabetes risk</p>
      </div>

      <div className="predict-container">
        {/* Input Form */}
        <div className="card">
          <h3 className="section-title" style={{ marginBottom: '2rem' }}><PlusCircle size={22} className="logo-icon" /> Medical Metrics Input</h3>

          <form onSubmit={handlePredictSubmit}>
            <div className="form-grid">

              <div className="form-group patient-identity">
                <label className="form-label">
                  <span>Patient Name</span>
                  <User size={16} />
                </label>
                <input
                  type="text"
                  name="name"
                  className={`form-input ${formErrors.name ? 'input-error' : ''}`}
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                />
                {formErrors.name && <span className="input-error-msg">{formErrors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Pregnancies</span>
                  <HelpCircle size={14} title="Number of times pregnant" style={{ color: 'var(--text-muted)' }} />
                </label>
                <input
                  type="number"
                  name="pregnancies"
                  min="0"
                  className={`form-input ${formErrors.pregnancies ? 'input-error' : ''}`}
                  placeholder="0"
                  value={formData.pregnancies}
                  onChange={handleInputChange}
                />
                <span className="form-hint">Number of pregnancies</span>
                {formErrors.pregnancies && <span className="input-error-msg">{formErrors.pregnancies}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Plasma Glucose (mg/dL)</span>
                  <Droplet size={16} style={{ color: 'var(--color-diabetic)' }} />
                </label>
                <input
                  type="number"
                  name="glucose"
                  min="0"
                  className={`form-input ${formErrors.glucose ? 'input-error' : ''}`}
                  placeholder="e.g. 120"
                  value={formData.glucose}
                  onChange={handleInputChange}
                />
                <span className="form-hint">2-Hour oral glucose test</span>
                {formErrors.glucose && <span className="input-error-msg">{formErrors.glucose}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Diastolic BP (mm Hg)</span>
                  <Heart size={16} style={{ color: '#ef4444' }} />
                </label>
                <input
                  type="number"
                  name="blood_pressure"
                  min="0"
                  className={`form-input ${formErrors.blood_pressure ? 'input-error' : ''}`}
                  placeholder="e.g. 80"
                  value={formData.blood_pressure}
                  onChange={handleInputChange}
                />
                <span className="form-hint">Blood pressure reading</span>
                {formErrors.blood_pressure && <span className="input-error-msg">{formErrors.blood_pressure}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Skin Thickness (mm)</span>
                  <Scale size={16} />
                </label>
                <input
                  type="number"
                  name="skin_thickness"
                  min="0"
                  className={`form-input ${formErrors.skin_thickness ? 'input-error' : ''}`}
                  placeholder="e.g. 20"
                  value={formData.skin_thickness}
                  onChange={handleInputChange}
                />
                <span className="form-hint">Triceps skin fold thickness</span>
                {formErrors.skin_thickness && <span className="input-error-msg">{formErrors.skin_thickness}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Serum Insulin (µU/mL)</span>
                  <Activity size={16} style={{ color: 'var(--accent-color)' }} />
                </label>
                <input
                  type="number"
                  name="insulin"
                  min="0"
                  className={`form-input ${formErrors.insulin ? 'input-error' : ''}`}
                  placeholder="e.g. 85"
                  value={formData.insulin}
                  onChange={handleInputChange}
                />
                <span className="form-hint">2-Hour serum insulin level</span>
                {formErrors.insulin && <span className="input-error-msg">{formErrors.insulin}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>BMI (kg/m²)</span>
                  <Activity size={16} />
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="bmi"
                  min="0"
                  className={`form-input ${formErrors.bmi ? 'input-error' : ''}`}
                  placeholder="e.g. 25.4"
                  value={formData.bmi}
                  onChange={handleInputChange}
                />
                <span className="form-hint">Body Mass Index value</span>
                {formErrors.bmi && <span className="input-error-msg">{formErrors.bmi}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Pedigree Score</span>
                  <TrendingUp size={16} />
                </label>
                <input
                  type="number"
                  step="0.001"
                  name="diabetes_pedigree_function"
                  min="0"
                  className={`form-input ${formErrors.diabetes_pedigree_function ? 'input-error' : ''}`}
                  placeholder="e.g. 0.47"
                  value={formData.diabetes_pedigree_function}
                  onChange={handleInputChange}
                />
                <span className="form-hint">Genetic risk coefficient</span>
                {formErrors.diabetes_pedigree_function && <span className="input-error-msg">{formErrors.diabetes_pedigree_function}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Age (years)</span>
                  <Calendar size={16} />
                </label>
                <input
                  type="number"
                  name="age"
                  min="1"
                  className={`form-input ${formErrors.age ? 'input-error' : ''}`}
                  placeholder="e.g. 35"
                  value={formData.age}
                  onChange={handleInputChange}
                />
                <span className="form-hint">Patient's current age</span>
                {formErrors.age && <span className="input-error-msg">{formErrors.age}</span>}
              </div>

            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }}
              disabled={predictLoading}
            >
              {predictLoading ? (
                <>
                  <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                  Evaluating patient profile...
                </>
              ) : (
                <>
                  <Brain size={18} /> Submit Diagnostic Check
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Card */}
        <div className="card result-card">
          {predictResult ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h3 className="result-title">Diagnostic Results</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Patient: <strong>{predictResult.name}</strong></p>

              <div className="meter-container">
                <svg className="radial-meter">
                  <circle className="meter-bg" cx="90" cy="90" r="75"></circle>
                  <circle
                    className={`meter-fill ${predictResult.prediction === 1 ? 'danger' : 'safe'}`}
                    cx="90"
                    cy="90"
                    r="75"
                    strokeDasharray={2 * Math.PI * 75}
                    strokeDashoffset={2 * Math.PI * 75 * (1 - predictResult.probability)}
                  ></circle>
                </svg>
                <div className="meter-text-overlay">
                  <span className="meter-percent">{(predictResult.probability * 100).toFixed(1)}%</span>
                  <span className="meter-label">Probability</span>
                </div>
              </div>

              <div className={`outcome-badge ${predictResult.prediction === 1 ? 'danger' : 'safe'}`}>
                {predictResult.prediction === 1 ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={20} /> Diabetic Risk Detected
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={20} /> Non-Diabetic Profile
                  </span>
                )}
              </div>

              <div className="insights-box">
                <div className="insights-header">
                  <Activity size={16} className="logo-icon" /> Clinical Interpretations:
                </div>
                <ul className="insights-list">
                  {predictResult.insights && predictResult.insights.map((insight, idx) => (
                    <li key={idx}>{insight}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="result-placeholder">
              <Brain size={48} style={{ color: 'var(--text-muted)' }} />
              <div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Awaiting Input</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Please fill out the patient's medical details on the left and submit the form to generate a report.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 3. Analytics Dashboard
function DashboardView({ metrics, stats, loading }) {
  if (loading.metrics || loading.stats) {
    return (
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner-wrapper">
          <div className="spinner"></div>
          <p>Processing Analytics Data...</p>
        </div>
      </div>
    );
  }

  // Model comparison bar data
  const modelData = metrics ? Object.keys(metrics).map(key => ({
    name: key,
    Accuracy: (metrics[key].accuracy * 100),
    F1_Score: (metrics[key].f1_score * 100),
  })) : [];

  // Group averages chart data
  const averagesData = stats ? [
    {
      metric: 'Plasma Glucose',
      Diabetic: stats.averages.diabetic.glucose,
      'Non-Diabetic': stats.averages.non_diabetic.glucose,
    },
    {
      metric: 'Body Mass Index',
      Diabetic: stats.averages.diabetic.bmi,
      'Non-Diabetic': stats.averages.non_diabetic.bmi,
    },
    {
      metric: 'Diastolic BP',
      Diabetic: stats.averages.diabetic.blood_pressure,
      'Non-Diabetic': stats.averages.non_diabetic.blood_pressure,
    }
  ] : [];

  // Age group pie data
  const ageGroupData = stats ? [
    { name: 'Under 30', value: stats.age_groups.under_30, color: '#10b981' },
    { name: '30-45 Years', value: stats.age_groups.age_30_45, color: '#3b82f6' },
    { name: '45-60 Years', value: stats.age_groups.age_45_60, color: '#f59e0b' },
    { name: 'Over 60', value: stats.age_groups.over_60, color: '#ef4444' }
  ].filter(e => e.value > 0) : [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Analytics & Model Performance</h1>
        <p className="page-subtitle">Diagnostic metrics, algorithm benchmarks, and clinical distributions</p>
      </div>

      {/* Summary Stat widgets */}
      {stats && (
        <div className="grid-4" style={{ marginBottom: '2.5rem' }}>
          <div className="card stat-card">
            <div className="stat-icon-wrapper">
              <Database size={24} />
            </div>
            <div className="stat-details">
              <span className="stat-value">{stats.total_predictions}</span>
              <span className="stat-label">Total Predictions</span>
            </div>
          </div>

          <div className="card stat-card">
            <div className="stat-icon-wrapper danger">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-details">
              <span className="stat-value">{stats.diabetic_count}</span>
              <span className="stat-label">Diabetic Cases</span>
            </div>
          </div>

          <div className="card stat-card">
            <div className="stat-icon-wrapper accent">
              <CheckCircle size={24} />
            </div>
            <div className="stat-details">
              <span className="stat-value">{stats.non_diabetic_count}</span>
              <span className="stat-label">Safe Cases</span>
            </div>
          </div>

          <div className="card stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)' }}>
              <Activity size={24} />
            </div>
            <div className="stat-details">
              <span className="stat-value">{stats.total_predictions > 0 ? ((stats.diabetic_count / stats.total_predictions) * 100).toFixed(0) : 0}%</span>
              <span className="stat-label">Risk Percentage</span>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-sections">
        {/* ML Performance Grid */}
        <div className="grid-2">
          {/* Models comparison bar chart */}
          <div className="card">
            <h3 className="section-title"><Award size={20} className="logo-icon" /> Machine Learning Algorithm Benchmarks</h3>
            <div style={{ width: '100%', height: 280, marginTop: '1.5rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--glass-border)', color: '#fff', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar dataKey="Accuracy" fill="#10b981" radius={[4, 4, 0, 0]} name="Accuracy (%)" />
                  <Bar dataKey="F1_Score" fill="#3b82f6" radius={[4, 4, 0, 0]} name="F1 Score (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Random Forest Performance Card */}
          <div className="card">
            <h3 className="section-title"><Brain size={20} className="logo-icon" /> Selected Model: Random Forest</h3>
            <div style={{ marginTop: '1rem' }}>
              <table className="model-metrics-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Logistic Regression</th>
                    <th>Decision Tree</th>
                    <th className="model-highlight">Random Forest</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics && (
                    <>
                      <tr>
                        <td>Accuracy</td>
                        <td>{(metrics["Logistic Regression"].accuracy * 100).toFixed(1)}%</td>
                        <td>{(metrics["Decision Tree"].accuracy * 100).toFixed(1)}%</td>
                        <td className="model-highlight">{(metrics["Random Forest"].accuracy * 100).toFixed(1)}%</td>
                      </tr>
                      <tr>
                        <td>F1-Score</td>
                        <td>{(metrics["Logistic Regression"].f1_score * 100).toFixed(1)}%</td>
                        <td>{(metrics["Decision Tree"].f1_score * 100).toFixed(1)}%</td>
                        <td className="model-highlight">{(metrics["Random Forest"].f1_score * 100).toFixed(1)}%</td>
                      </tr>
                      <tr>
                        <td>Precision</td>
                        <td>{(metrics["Logistic Regression"].precision * 100).toFixed(1)}%</td>
                        <td>{(metrics["Decision Tree"].precision * 100).toFixed(1)}%</td>
                        <td className="model-highlight">{(metrics["Random Forest"].precision * 100).toFixed(1)}%</td>
                      </tr>
                      <tr>
                        <td>Recall</td>
                        <td>{(metrics["Logistic Regression"].recall * 100).toFixed(1)}%</td>
                        <td>{(metrics["Decision Tree"].recall * 100).toFixed(1)}%</td>
                        <td className="model-highlight">{(metrics["Random Forest"].recall * 100).toFixed(1)}%</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>

              {metrics && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
                    Random Forest Confusion Matrix
                  </h4>
                  <div className="confusion-matrix-grid">
                    <div className="cm-cell">
                      <div className="cm-cell-label">True Neg</div>
                      <div className="cm-cell-value" style={{ color: 'var(--color-safe)' }}>{metrics["Random Forest"].confusion_matrix[0][0]}</div>
                    </div>
                    <div className="cm-cell">
                      <div className="cm-cell-label">False Pos</div>
                      <div className="cm-cell-value" style={{ color: 'var(--color-diabetic)' }}>{metrics["Random Forest"].confusion_matrix[0][1]}</div>
                    </div>
                    <div className="cm-cell">
                      <div className="cm-cell-label">False Neg</div>
                      <div className="cm-cell-value" style={{ color: 'var(--color-diabetic)' }}>{metrics["Random Forest"].confusion_matrix[1][0]}</div>
                    </div>
                    <div className="cm-cell">
                      <div className="cm-cell-label">True Pos</div>
                      <div className="cm-cell-value" style={{ color: 'var(--color-safe)' }}>{metrics["Random Forest"].confusion_matrix[1][1]}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Database distribution Analytics */}
        {stats && stats.total_predictions > 0 ? (
          <div className="grid-2">
            {/* Clinical averages chart */}
            <div className="card">
              <h3 className="section-title"><Activity size={20} className="logo-icon" /> Diagnostic Parameter Breakdown</h3>
              <div style={{ width: '100%', height: 280, marginTop: '1.5rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={averagesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="metric" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                    <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--glass-border)', color: '#fff', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Bar dataKey="Non-Diabetic" fill="var(--color-safe)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Diabetic" fill="var(--color-diabetic)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Age group distribution chart */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyItems: 'center' }}>
              <h3 className="section-title"><User size={20} className="logo-icon" /> Patient Age Distribution</h3>
              <div style={{ width: '100%', height: 200, marginTop: '1rem', position: 'relative' }}>
                {ageGroupData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ageGroupData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {ageGroupData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--glass-border)', color: '#fff', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '3rem' }}>No data</div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginTop: '1.5rem' }}>
                {ageGroupData.map((entry, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: entry.color }}></div>
                    <span style={{ color: 'var(--text-secondary)' }}>{entry.name}:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{entry.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
            <Database size={32} style={{ marginBottom: '1rem' }} />
            <h4>No Clinical Records Saved Yet</h4>
            <p style={{ fontSize: '0.85rem' }}>Generate patient predictions to see interactive demographic visualizations.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 4. Prediction History Table & CSV exporter
function HistoryView({
  history, searchQuery, setSearchQuery, handleDeleteRecord,
  handleExportCSV, loading
}) {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Prediction History</h1>
        <p className="page-subtitle">Logs of previously evaluated patients stored in SQLite</p>
      </div>

      <div className="card">
        <div className="search-bar-container">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="form-input search-input"
              placeholder="Search by patient name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            className="btn btn-secondary"
            onClick={handleExportCSV}
            disabled={history.length === 0}
          >
            <Download size={18} /> Export as CSV
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1.5rem' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Retrieving clinical database...</p>
          </div>
        ) : history.length > 0 ? (
          <div className="table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Age</th>
                  <th>Glucose</th>
                  <th>BMI</th>
                  <th>BP</th>
                  <th>Pregnancies</th>
                  <th>Outcome</th>
                  <th>Probability</th>
                  <th>Evaluation Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map(record => (
                  <tr key={record.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{record.name}</td>
                    <td>{record.age} yrs</td>
                    <td>{record.glucose} mg/dL</td>
                    <td>{record.bmi}</td>
                    <td>{record.blood_pressure}</td>
                    <td>{record.pregnancies}</td>
                    <td>
                      <span className={`badge-status ${record.prediction === 1 ? 'positive' : 'negative'}`}>
                        {record.prediction === 1 ? 'Diabetic Risk' : 'Non-Diabetic'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {(record.probability * 100).toFixed(1)}%
                    </td>
                    <td>
                      {new Date(record.created_at).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td>
                      <button
                        className="action-btn"
                        onClick={() => handleDeleteRecord(record.id)}
                        title="Delete patient record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Search size={36} />
            <div>
              <h4>No Patients Found</h4>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {searchQuery ? "No records matches your query. Try searching for another name." : "The clinical prediction database is empty."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
