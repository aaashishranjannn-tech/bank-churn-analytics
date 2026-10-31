# 🏦 Customer Segmentation & Churn Pattern Analytics in European Banking

An end-to-end, enterprise-grade Machine Learning and Streamlit Business Intelligence solution designed to analyze, predict, and mitigate customer attrition across European retail banking institutions (France, Germany, and Spain).

![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-blue.svg)
![Streamlit](https://img.shields.io/badge/Streamlit-1.28%2B-red.svg)
![Scikit-Learn](https://img.shields.io/badge/scikit--learn-1.3%2B-orange.svg)
![Plotly](https://img.shields.io/badge/Plotly-5.17%2B-navy.svg)
![Pandas](https://img.shields.io/badge/Pandas-2.0%2B-yellow.svg)

---

## 📌 Project Overview

Customer churn in retail banking causes severe revenue losses, deposit run-off, and customer acquisition inefficiency. This project analyzes **10,000 European retail banking accounts** across France, Germany, and Spain to detect attrition drivers, segment the client base into actionable risk cohorts, and deploy supervised machine learning models to forecast customer defection before it occurs.

### Key Business Insights Discovered
- **Geographic Vulnerability:** German accounts churn at **32.44%**, double that of France (**16.15%**) and Spain (**16.67%**), generating a **Geographic Risk Index (GRI) of 159.3**.
- **The Product Saturation Paradox:** Accounts with **2 products** demonstrate optimum retention (**7.58%** churn). However, accounts holding **3 products** suffer an **82.71%** churn rate, and accounts holding **4 products** exhibit **100% defection**.
- **Age-Cohort Risk:** Mature customers aged **46–60 years** have the highest churn rate at **51.12%**, compared to only **7.56%** for customers under 30.
- **Deposit Erosion:** Funded accounts (> \$0 balance) churn at **24.08%** versus **13.82%** for zero-balance accounts, proving that churn heavily drains active deposit capital.
- **Engagement Multiplier:** Inactive accounts churn at **26.85%** compared to **14.27%** for active members (**1.88x Engagement Drop Indicator**).

---

## 🏗️ Project Architecture & Directory Structure

```
bank-churn-analytics/
│
├── app.py                     # Interactive Streamlit dashboard with navy/blue banking UI
├── requirements.txt           # Python dependencies
├── README.md                  # Comprehensive project documentation
├── .gitignore                 # Standard Python/IDE ignore rules
│
├── data/
│   └── bank_churn.csv         # 10,000 record European banking dataset
│
├── models/
│   └── churn_model.pkl        # Serialized ML pipeline bundle (Model + Preprocessor + Metrics)
│
├── src/
│   ├── __init__.py
│   ├── data_loader.py         # Data ingestion, schema validation & data quality summary
│   ├── preprocessing.py      # Feature engineering, binning, encoding, scaling & train/test split
│   ├── analysis.py            # Mathematical KPIs (CR, GRI, EDI, HVCR) & automated insights
│   ├── segmentation.py        # Cohort aggregation across 8 dimensions & high-value archetypes
│   └── model.py               # Model training (Logistic Regression vs Random Forest), evaluation & inference
│
├── notebooks/
│   ├── churn_analysis.ipynb   # Reproducible Jupyter notebook with end-to-end EDA and modeling
│   └── generate_notebook.py   # Notebook generation script
│
├── reports/
│   └── research_report.md     # In-depth academic/industrial empirical research paper
│
└── outputs/                   # Exported figures, reports, and models
```

---

## 🛠️ Technology Stack

| Domain | Tools / Libraries |
|---|---|
| **Programming Language** | Python 3.11+ |
| **Data Manipulation & Analysis** | Pandas, NumPy |
| **Data Visualization** | Plotly Express & Graph Objects, Matplotlib, Seaborn |
| **Machine Learning** | Scikit-learn (RandomForestClassifier, LogisticRegression, ColumnTransformer, StandardScaler, OneHotEncoder) |
| **Model Serialization** | Joblib |
| **Web Dashboard** | Streamlit |

---

## 📐 Mathematical Key Performance Indicators (KPIs)

The analytical engine computes five standardized banking retention KPIs:

1. **Overall Churn Rate ($CR$):**
   $$CR = \frac{N_{\text{churned}}}{N_{\text{total}}} \times 100 = 20.37\%$$

2. **Segment Churn Rate ($SCR_s$):**
   $$SCR_s = \frac{N_{\text{churned}, s}}{N_{\text{total}, s}} \times 100$$

3. **Geographic Risk Index ($GRI_c$):**
   $$GRI_c = \frac{SCR_c}{CR_{\text{baseline}}} \times 100$$
   *(Germany: 159.3, France: 79.3, Spain: 81.8)*

4. **Engagement Drop Indicator ($EDI$):**
   $$EDI = \frac{SCR_{\text{Inactive}}}{SCR_{\text{Active}}} = \frac{26.85\%}{14.27\%} = 1.88\text{x}$$

5. **High-Value Churn Ratio ($HVCR$):**
   $$HVCR = \frac{N_{\text{HV churned}}}{N_{\text{Total churned}}} \times 100 = 56.11\%$$

---

## 🤖 Machine Learning Methodology & Results

- **Data Partition:** 80% Stratified Training (8,000 rows) / 20% Stratified Holdout Test (2,000 rows).
- **Leakage Prevention:** Transformers (StandardScaler for continuous variables, OneHotEncoder for nominal variables) are fitted **strictly** on the training partition.
- **Class Imbalance Mitigation:** Both models utilize `class_weight='balanced'` to offset the ~4:1 non-churn to churn ratio.
- **Feature Hygiene:** `CustomerId`, `Surname`, and `Year` are strictly excluded from model feature sets.

### Holdout Test Set Performance (N = 2,000)

| Algorithm | Accuracy | Precision | Recall | F1-Score | ROC-AUC |
|---|---|---|---|---|---|
| **Logistic Regression (Balanced)** | 70.85% | 38.86% | **68.30%** | 49.55% | 0.7712 |
| **Random Forest (Balanced, Depth=10)** | **83.60%** | **58.26%** | 61.43% | **59.80%** | **0.8604** |

**Champion Model:** **Random Forest Classifier** selected for production deployment based on top ROC-AUC (0.8604) and F1-score (0.5980).

---

## 🖥️ Streamlit Dashboard Modules

The web dashboard is organized into seven executive modules:

1. **Executive Overview:** High-level KPI cards, overall churn gauge/donut, multi-dimensional churn summary, and automated data-driven insights.
2. **Geography Analysis:** Deep dive into France, Germany, and Spain with interactive GRI badges, market share vs defection breakdown, and country financial tables.
3. **Demographic Cohorts:** Age brackets, gender attrition gaps, credit score tiers, and a 2D Country vs Age heatmap.
4. **Financial Profile & High-Value Explorer:** Product cross-selling curves, balance tiers, and an interactive High-Value Capital Protection explorer.
5. **Engagement & Tenure:** Inactive member multipliers and 0–10 year tenure retention trends.
6. **Customer Explorer:** Real-time searchable customer database with dynamic pagination and one-click CSV export.
7. **ML Churn Predictor:** Live client scoring form computing defect probability, risk tier badges (Low / Medium / High), model confusion matrix, and feature importance rankings.

---

## 🚀 Installation & Quickstart

### Prerequisites
- Python 3.11, 3.12, or 3.13 installed.
- Git (optional).

### 1. Clone or Navigate to the Repository
```bash
cd bank-churn-analytics
```

### 2. Set Up a Virtual Environment (Recommended)
```bash
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Train the ML Model (Optional - Pre-trained bundle included)
```bash
python -c "from src.model import train_and_save_pipeline; train_and_save_pipeline()"
```

### 5. Launch the Streamlit Web Application
```bash
streamlit run app.py
```
The application will open automatically in your browser at `http://localhost:8501`.

---

## 📊 Running Analysis in Jupyter Notebook
To run the interactive analysis notebook:
```bash
jupyter notebook notebooks/churn_analysis.ipynb
```

---

## 📄 License & Attribution
Developed for European Retail Banking Portfolio Analytics and Machine Learning Demonstrations.
Dataset based on standard European Retail Banking customer behavior benchmarks.
