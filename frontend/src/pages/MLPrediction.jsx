import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { ML_MODELS, FEATURE_IMPORTANCE, CONFUSION_MATRIX } from '../data/analyticsData';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const chartBaseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(10,10,10,0.95)',
      borderColor: 'rgba(57,255,20,0.2)',
      borderWidth: 1,
      titleColor: '#39ff14',
      bodyColor: '#f5f0e8',
      titleFont: { family: "'Space Grotesk', sans-serif", size: 11 },
      bodyFont: { family: "'Inter', sans-serif", size: 10 },
    },
  },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8a8a8a', font: { family: "'Inter', sans-serif", size: 10 } } },
    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8a8a8a', font: { family: "'Inter', sans-serif", size: 10 } } },
  },
};

// Rule-based mock predictor
function computeRisk(inputs) {
  const {
  age,
  creditScore,
  geography,
  gender,
  tenure,
  balance,
  products,
  isActive,
  hasCreditCard,
  estimatedSalary,
} = inputs;

  let score = 0;

  // Age factor
  if (age > 60) score += 30;
  else if (age > 45) score += 20;
  else if (age > 30) score += 5;

  // Products factor
  if (products >= 4) score += 45;
  else if (products === 3) score += 30;
  else if (products === 1) score += 10;
  else score += 2; // 2 products = best

  // Activity factor
  if (!isActive) score += 15;

  // Geography
  if (geography === 'Germany') score += 15;
  else if (geography === 'Spain') score += 5;

  // Credit score
  if (creditScore < 500) score += 10;
  else if (creditScore < 600) score += 5;
  else if (creditScore > 750) score -= 5;

  // Balance
  if (balance > 100000) score += 8;
  else if (balance === 0) score -= 3;

  // Gender
  if (gender === 'Female') score += 8;

  // Tenure
  if (tenure < 2) score += 5;

  const prob = Math.min(Math.max(score, 2), 97);
  return prob;
}

function getRiskTier(prob) {
  if (prob < 25) return { label: 'LOW RISK', color: '#39ff14' };
  if (prob < 55) return { label: 'MEDIUM RISK', color: '#d4a843' };
  if (prob < 80) return { label: 'HIGH RISK', color: '#ff6633' };
  return { label: 'CRITICAL RISK', color: '#ff2222' };
}

// ROC curve data (approximate from RF model)
const ROC_DATA = [
  { fpr: 0, tpr: 0 },
  { fpr: 0.05, tpr: 0.42 },
  { fpr: 0.1, tpr: 0.58 },
  { fpr: 0.15, tpr: 0.67 },
  { fpr: 0.2, tpr: 0.73 },
  { fpr: 0.3, tpr: 0.80 },
  { fpr: 0.4, tpr: 0.85 },
  { fpr: 0.5, tpr: 0.89 },
  { fpr: 0.6, tpr: 0.92 },
  { fpr: 0.7, tpr: 0.94 },
  { fpr: 0.8, tpr: 0.96 },
  { fpr: 0.9, tpr: 0.98 },
  { fpr: 1.0, tpr: 1.0 },
];

export default function MLPrediction() {
 const [form, setForm] = useState({
  age: 40,
  creditScore: 650,
  tenure: 5,
  geography: 'France',
  gender: 'Male',
  products: 1,
  balance: 75000,
  isActive: true,
  hasCreditCard: true,
  estimatedSalary: 80000,
});
  const [result, setResult] = useState(null);

  const handleChange = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : (e.target.type === 'range' || e.target.type === 'number' ? Number(e.target.value) : e.target.value);
    setForm(prev => ({ ...prev, [field]: val }));
    setResult(null);
  };

 const handleCompute = async () => {
    // Prepare customer data for Python ML backend
    const customerData = {
      CreditScore: Number(form.creditScore),
      Geography: form.geography,
      Gender: form.gender,
      Age: Number(form.age),
      Tenure: Number(form.tenure),
      Balance: Number(form.balance),
      NumOfProducts: Number(form.products),
      HasCrCard: Number(form.hasCreditCard),
      IsActiveMember: Number(form.isActive),
      EstimatedSalary: Number(form.estimatedSalary),
    };

    console.log("Customer Data:", customerData);

    try {
       const response = await fetch("/api/predict", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch prediction from backend');
      }

      const data = await response.json();
      
      // Convert real probability (e.g., 0.45) to a percentage (45)
      const prob = Math.round(data.probability * 100);
      const tier = getRiskTier(prob);
      setResult({ prob, tier });

    } catch (error) {
      console.error("Backend connection failed:", error);
    }
  };
  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(57,255,20,0.2)',
    borderRadius: '2px',
    color: '#f5f0e8',
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.85rem',
    padding: '0.6rem 0.75rem',
    outline: 'none',
  };

  const labelStyle = {
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.6rem',
    letterSpacing: '0.15em',
    color: '#8a8a8a',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: '0.4rem',
  };

  const fieldStyle = { marginBottom: '1.25rem' };

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: '7rem clamp(1.5rem, 5vw, 4rem) 4rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.6rem', letterSpacing: '0.35em', color: '#39ff14', marginBottom: '0.5rem' }}>
          06 / ML PREDICTION ENGINE
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 700, color: '#f5f0e8', letterSpacing: '-0.02em' }}>
          Churn Prediction
        </h1>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 420px) 1fr', gap: '4rem', alignItems: 'start' }}>
        {/* LEFT: Predictor form */}
        <div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.6rem', letterSpacing: '0.3em', color: '#39ff14', marginBottom: '1.5rem' }}>
            RISK CALCULATOR
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Age: {form.age}</label>
            <input type="range" min="18" max="90" value={form.age} onChange={handleChange('age')}
              style={{ width: '100%', accentColor: '#39ff14' }} />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Credit Score: {form.creditScore}</label>
            <input type="range" min="350" max="850" value={form.creditScore} onChange={handleChange('creditScore')}
              style={{ width: '100%', accentColor: '#39ff14' }} />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Tenure (years): {form.tenure}</label>
            <input type="range" min="0" max="10" value={form.tenure} onChange={handleChange('tenure')}
              style={{ width: '100%', accentColor: '#39ff14' }} />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Balance (\$)</label>
            <input type="number" value={form.balance} onChange={handleChange('balance')}
              style={inputStyle} onFocus={e => e.target.style.borderColor = '#39ff14'}
              onBlur={e => e.target.style.borderColor = 'rgba(57,255,20,0.2)'} />
          </div>

          <div style={fieldStyle}>
  <label style={labelStyle}>Estimated Salary ($)</label>
  <input
    type="number"
    min="0"
    max="200000"
    step="100"
    value={form.estimatedSalary}
    onChange={handleChange('estimatedSalary')}
    style={inputStyle}
  />
</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Geography</label>
              <select value={form.geography} onChange={handleChange('geography')} style={{ ...inputStyle, cursor: 'pointer' }}>
                {['France', 'Germany', 'Spain'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Gender</label>
              <select value={form.gender} onChange={handleChange('gender')} style={{ ...inputStyle, cursor: 'pointer' }}>
                {['Male', 'Female'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Number of Products</label>
            <select value={form.products} onChange={handleChange('products')} style={{ ...inputStyle, cursor: 'pointer' }}>
              {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} Product{n > 1 ? 's' : ''}</option>)}
            </select>
          </div>

          <div style={{ ...fieldStyle, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input type="checkbox" id="active" checked={form.isActive} onChange={handleChange('isActive')}
              style={{ accentColor: '#39ff14', width: '16px', height: '16px', cursor: 'pointer' }} />
            <label htmlFor="active" style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer' }}>Is Active Member</label>
          </div>

          <div style={{
  ...fieldStyle,
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem'
}}>
  <input
    type="checkbox"
    id="creditCard"
    checked={form.hasCreditCard}
    onChange={handleChange('hasCreditCard')}
    style={{
      accentColor: '#39ff14',
      width: '16px',
      height: '16px',
      cursor: 'pointer'
    }}
  />
  <label
    htmlFor="creditCard"
    style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer' }}
  >
    Has Credit Card
  </label>
</div>

          <button
            onClick={handleCompute}
            style={{
              width: '100%',
              padding: '0.9rem',
              border: '1px solid #39ff14',
              background: 'transparent',
              color: '#39ff14',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '0.75rem',
              letterSpacing: '0.25em',
              cursor: 'pointer',
              transition: 'all 0.25s',
              marginTop: '0.5rem',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#39ff14'; e.currentTarget.style.color = '#0a0a0a'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#39ff14'; }}
          >
            COMPUTE RISK
          </button>

          {/* Result */}
          {result && (
            <div
              style={{
                marginTop: '2rem',
                padding: '1.5rem',
                border: `1px solid ${result.tier.color}44`,
                background: `${result.tier.color}08`,
                textAlign: 'center',
              }}
            >
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.55rem', letterSpacing: '0.3em', color: '#8a8a8a', marginBottom: '0.5rem' }}>
                CHURN PROBABILITY
              </div>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '3.5rem', 
                fontWeight: 700,
                color: result.tier.color,
                lineHeight: 1,
                textShadow: `0 0 20px ${result.tier.color}44`,
              }}>
                {result.prob}%
              </div>
              <div style={{
                display: 'inline-block',
                marginTop: '0.75rem',
                padding: '0.3rem 1rem',
                border: `1px solid ${result.tier.color}`,
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '0.6rem',
                letterSpacing: '0.2em',
                color: result.tier.color,
              }}>
                {result.tier.label}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Model metrics & charts */}
        <div>
          {/* Model cards */}
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.6rem', letterSpacing: '0.3em', color: '#39ff14', marginBottom: '1.25rem' }}>
            MODEL PERFORMANCE — RANDOM FOREST (BEST)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
            {[
              { label: 'Accuracy', value: '82.25%' },
              { label: 'ROC-AUC', value: '86.47%' },
              { label: 'Recall', value: '72.97%' },
              { label: 'F1 Score', value: '62.59%' },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  background: 'rgba(57,255,20,0.04)',
                  border: '1px solid rgba(57,255,20,0.12)',
                  padding: '1rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: '#39ff14' }}>{value}</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.6rem', color: '#8a8a8a', letterSpacing: '0.1em', marginTop: '0.3rem' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Feature importance chart */}
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.6rem', letterSpacing: '0.3em', color: '#39ff14', marginBottom: '1rem' }}>
            FEATURE IMPORTANCE
          </div>
          <div style={{ height: '240px', marginBottom: '2.5rem' }}>
            <Bar
              data={{
                labels: FEATURE_IMPORTANCE.map(f => f.feature),
                datasets: [{
                  data: FEATURE_IMPORTANCE.map(f => (f.importance * 100).toFixed(1)),
                  backgroundColor: FEATURE_IMPORTANCE.map((f, i) => i === 0 ? 'rgba(57,255,20,0.6)' : 'rgba(57,255,20,0.2)'),
                  borderColor: '#39ff14',
                  borderWidth: 1,
                  borderRadius: 2,
                  indexAxis: 'y',
                }],
              }}
              options={{
                ...chartBaseOptions,
                indexAxis: 'y',
                scales: {
                  x: { ...chartBaseOptions.scales.x, ticks: { ...chartBaseOptions.scales.x.ticks, callback: v => v + '%' } },
                  y: { ...chartBaseOptions.scales.y },
                },
              }}
            />
          </div>

          {/* ROC Curve */}
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.6rem', letterSpacing: '0.3em', color: '#39ff14', marginBottom: '1rem' }}>
            ROC CURVE (AUC = 0.8647)
          </div>
          <div style={{ height: '200px', marginBottom: '2.5rem' }}>
            <Line
              data={{
                labels: ROC_DATA.map(d => d.fpr.toFixed(2)),
                datasets: [
                  {
                    label: 'ROC Curve',
                    data: ROC_DATA.map(d => d.tpr),
                    borderColor: '#39ff14',
                    backgroundColor: 'rgba(57,255,20,0.06)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0,
                  },
                  {
                    label: 'Random',
                    data: ROC_DATA.map(d => d.fpr),
                    borderColor: 'rgba(138,138,138,0.3)',
                    borderDash: [4, 4],
                    fill: false,
                    tension: 0,
                    pointRadius: 0,
                  },
                ],
              }}
              options={{
                ...chartBaseOptions,
                plugins: { ...chartBaseOptions.plugins, legend: { display: false } },
                scales: {
                  x: { ...chartBaseOptions.scales.x, title: { display: true, text: 'FPR', color: '#8a8a8a', font: { size: 9 } } },
                  y: { ...chartBaseOptions.scales.y, title: { display: true, text: 'TPR', color: '#8a8a8a', font: { size: 9 } } },
                },
              }}
            />
          </div>

          {/* Confusion Matrix */}
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.6rem', letterSpacing: '0.3em', color: '#39ff14', marginBottom: '1rem' }}>
            CONFUSION MATRIX
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', maxWidth: '320px' }}>
            {[
              { label: 'True Positive', value: CONFUSION_MATRIX.tp, color: '#39ff14', desc: 'Correctly predicted churn' },
              { label: 'False Positive', value: CONFUSION_MATRIX.fp, color: '#d4a843', desc: 'Predicted churn, stayed' },
              { label: 'False Negative', value: CONFUSION_MATRIX.fn, color: '#ff6633', desc: 'Missed churn' },
              { label: 'True Negative', value: CONFUSION_MATRIX.tn, color: '#39ff14', desc: 'Correctly predicted stay' },
            ].map(({ label, value, color, desc }) => (
              <div key={label} style={{ background: `${color}0a`, border: `1px solid ${color}22`, padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.4rem', fontWeight: 700, color }}>{value.toLocaleString()}</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.55rem', color: '#8a8a8a', letterSpacing: '0.1em', marginTop: '0.3rem' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
