
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

app = FastAPI(
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Loading dataset and training model...")

# 1. Load dataset using an absolute path
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "bank_churn.csv"

df = pd.read_csv(DATA_PATH)

# 2. Define the exact 10 frontend features
feature_columns = [
    'CreditScore',
    'Geography',
    'Gender',
    'Age',
    'Tenure',
    'Balance',
    'NumOfProducts',
    'HasCrCard',
    'IsActiveMember',
    'EstimatedSalary'
]

X = df[feature_columns].copy()
y = df['Exited']

# 3. Create and SAVE category mappings during training
category_mappings = {}

for col in ['Geography', 'Gender']:
    categories = X[col].astype('category').cat.categories

    category_mappings[col] = {
        category: code
        for code, category in enumerate(categories)
    }

    X[col] = X[col].map(category_mappings[col])

# 4. Train model
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

model.fit(X, y)

print("Model trained and ready for requests!")


# 5. Prediction endpoint
@app.post("/api/predict")
def predict(data: dict):

    # Check all required features are present
    missing = [
        col for col in feature_columns
        if col not in data
    ]

    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing features: {missing}"
        )

    # Create DataFrame in exact feature order
    input_df = pd.DataFrame(
        [[data[col] for col in feature_columns]],
        columns=feature_columns
    )

    # Apply the SAME category mappings used during training
    for col in ['Geography', 'Gender']:

        value = input_df.at[0, col]

        if value not in category_mappings[col]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid {col}: {value}"
            )

        input_df[col] = input_df[col].map(
            category_mappings[col]
        )

    # Convert numerical features
    numeric_columns = [
        col for col in feature_columns
        if col not in ['Geography', 'Gender']
    ]

    for col in numeric_columns:
        input_df[col] = pd.to_numeric(
            input_df[col],
            errors='coerce'
        )

    if input_df.isnull().any().any():
        raise HTTPException(
            status_code=400,
            detail="Invalid or missing feature values"
        )

    # Run actual ML prediction
    prediction = int(model.predict(input_df)[0])

    probability = float(
        model.predict_proba(input_df)[0][1]
    )

    return {
        "prediction": prediction,
        "probability": probability
    }
