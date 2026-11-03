from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

app = FastAPI()

# Enable CORS for your React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Loading dataset and training model...")

# 1. Load data directly from your CSV file
df = pd.read_csv("../data/bank_churn.csv")

# 2. Define the exact 10 features your React frontend sends
feature_columns = [
    'CreditScore', 'Geography', 'Gender', 'Age', 'Tenure', 
    'Balance', 'NumOfProducts', 'HasCrCard', 'IsActiveMember', 'EstimatedSalary'
]

X = df[feature_columns].copy()

# Encode text columns (Geography, Gender) into numbers so the model can read them
for col in ['Geography', 'Gender']:
    if col in X.columns:
        X[col] = X[col].astype('category').cat.codes

y = df['Exited']  # Churn target column

# 3. Train a fresh model right here on startup
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

print("Model trained and ready for requests!")

@app.post("/predict")
def predict(data: dict):
    # Convert incoming JSON from React into a DataFrame
    input_df = pd.DataFrame([data])
    
    # Apply the same categorical encoding
    for col in ['Geography', 'Gender']:
        if col in input_df.columns:
            input_df[col] = input_df[col].astype('category').cat.codes
            
    # Run real inference
    prediction = int(model.predict(input_df)[0])
    probability = float(model.predict_proba(input_df)[0][1]) # Churn probability
    
    return {"prediction": prediction, "probability": probability}