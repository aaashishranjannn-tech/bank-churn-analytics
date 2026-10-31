"""
Machine Learning Modeling, Evaluation, and Inference Module for Bank Churn Analytics.
"""

from pathlib import Path
from typing import Dict, Any, Tuple
import joblib
import numpy as np
import pandas as pd
from typing import Optional
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    roc_curve,
)

from src.data_loader import load_data
from src.preprocessing import prepare_train_test_data, get_feature_names

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
MODEL_PATH = MODELS_DIR / "churn_model.pkl"


def train_models(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Train Logistic Regression and Random Forest models with balanced class weights
    to address the ~20% churn class imbalance.
    """
    models = {
        "Logistic Regression": LogisticRegression(
            class_weight="balanced",
            max_iter=1000,
            random_state=random_state,
            solver="lbfgs"
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=150,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=random_state,
            n_jobs=1
        )
    }

    trained_models = {}
    for name, clf in models.items():
        clf.fit(X_train, y_train)
        trained_models[name] = clf

    return trained_models


def evaluate_model(
    model: Any,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    feature_names: list
) -> Dict[str, Any]:
    """
    Comprehensive evaluation of a binary classification model.
    """
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    roc_auc = roc_auc_score(y_test, y_proba)

    cm = confusion_matrix(y_test, y_pred)
    fpr, tpr, thresholds = roc_curve(y_test, y_proba)

    # Feature importances or coefficients
    feature_importance_df = pd.DataFrame()
    if hasattr(model, "feature_importances_"):
        feature_importance_df = pd.DataFrame({
            "Feature": feature_names,
            "Importance": model.feature_importances_
        }).sort_values(by="Importance", ascending=False)
    elif hasattr(model, "coef_"):
        feature_importance_df = pd.DataFrame({
            "Feature": feature_names,
            "Importance": np.abs(model.coef_[0]),
            "Coefficient": model.coef_[0]
        }).sort_values(by="Importance", ascending=False)

    return {
        "metrics": {
            "Accuracy": round(float(acc), 4),
            "Precision": round(float(prec), 4),
            "Recall": round(float(rec), 4),
            "F1-score": round(float(f1), 4),
            "ROC-AUC": round(float(roc_auc), 4),
        },
        "confusion_matrix": cm.tolist(),
        "roc_curve": {
            "fpr": fpr.tolist(),
            "tpr": tpr.tolist(),
            "thresholds": thresholds.tolist(),
        },
        "feature_importance": feature_importance_df.to_dict(orient="records") if not feature_importance_df.empty else [],
    }


def compare_and_select_best_model(
    evaluation_results: Dict[str, Dict[str, Any]],
    primary_metric: str = "ROC-AUC"
) -> Tuple[str, pd.DataFrame]:
    """
    Generate model comparison table and designate best model according to primary metric.
    """
    records = []
    for model_name, res in evaluation_results.items():
        row = {"Model": model_name}
        row.update(res["metrics"])
        records.append(row)

    comparison_df = pd.DataFrame(records).sort_values(by=primary_metric, ascending=False)
    best_model_name = comparison_df.iloc[0]["Model"]

    return best_model_name, comparison_df


def train_and_save_pipeline(
    df: Optional[pd.DataFrame] = None,
    output_path: Optional[Path] = None
) -> Dict[str, Any]:
    """
    End-to-end pipeline training, evaluation, comparison, and serialization.
    """
    if df is None:
        df = load_data()

    split_data = prepare_train_test_data(df, test_size=0.2, random_state=42)
    X_train = split_data["X_train"]
    X_test = split_data["X_test"]
    y_train = split_data["y_train"]
    y_test = split_data["y_test"]
    preprocessor = split_data["preprocessor"]
    feature_names = split_data["feature_names"]

    trained_models = train_models(X_train, y_train, random_state=42)

    evaluations = {}
    for name, model in trained_models.items():
        evaluations[name] = evaluate_model(model, X_test, y_test, feature_names)

    best_name, comparison_df = compare_and_select_best_model(evaluations, primary_metric="ROC-AUC")
    best_model = trained_models[best_name]

    # Package artifact bundle
    bundle = {
        "best_model_name": best_name,
        "best_model": best_model,
        "preprocessor": preprocessor,
        "feature_names": feature_names,
        "all_models": trained_models,
        "evaluations": evaluations,
        "comparison_table": comparison_df.to_dict(orient="records"),
        "training_sample_count": len(X_train),
        "test_sample_count": len(X_test),
    }

    target_path = Path(output_path) if output_path else MODEL_PATH
    target_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, target_path)

    return bundle


def load_model_bundle(model_path: Optional[Path] = None) -> Dict[str, Any]:
    """
    Load saved model artifact bundle from disk.
    """
    path = Path(model_path) if model_path else MODEL_PATH
    if not path.exists():
        raise FileNotFoundError(f"Model file not found at {path}. Run training first.")
    return joblib.load(path)


def predict_churn_single(customer_data: Dict[str, Any], bundle: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Predict churn probability and assign a risk tier for an individual customer.
    """
    if bundle is None:
        bundle = load_model_bundle()

    preprocessor = bundle["preprocessor"]
    model = bundle["best_model"]
    feature_names = bundle["feature_names"]

    # Build single-row DataFrame
    input_df = pd.DataFrame([customer_data])

    # Transform through fitted preprocessor
    X_trans = preprocessor.transform(input_df)
    X_trans_df = pd.DataFrame(X_trans, columns=feature_names)

    prob = float(model.predict_proba(X_trans_df)[0, 1])
    pred = int(model.predict(X_trans_df)[0])

    if prob >= 0.60:
        risk_category = "High"
        risk_color = "#E63946"
    elif prob >= 0.35:
        risk_category = "Medium"
        risk_color = "#F4A261"
    else:
        risk_category = "Low"
        risk_color = "#2A9D8F"

    return {
        "churn_probability": round(prob, 4),
        "churn_probability_pct": round(prob * 100, 2),
        "predicted_exit": pred,
        "risk_category": risk_category,
        "risk_color": risk_color,
        "model_used": bundle["best_model_name"],
        "disclaimer": "This prediction is a statistical estimate based on historical data patterns and should be used to support, not replace, relationship management decisions."
    }


if __name__ == "__main__":
    print("Executing ML training pipeline on actual European banking dataset...")
    bundle = train_and_save_pipeline()
    print(f"\nBest model selected: {bundle['best_model_name']}")
    print("\nModel Evaluation Comparison Table:")
    for row in bundle["comparison_table"]:
        print(f"  - {row['Model']}: Accuracy={row['Accuracy']:.4f}, Precision={row['Precision']:.4f}, Recall={row['Recall']:.4f}, F1={row['F1-score']:.4f}, ROC-AUC={row['ROC-AUC']:.4f}")

    print("\nTesting individual inference...")
    sample = {
        "CreditScore": 600,
        "Geography": "Germany",
        "Gender": "Female",
        "Age": 48,
        "Tenure": 3,
        "Balance": 120000.0,
        "NumOfProducts": 3,
        "HasCrCard": 1,
        "IsActiveMember": 0,
        "EstimatedSalary": 80000.0
    }
    result = predict_churn_single(sample, bundle)
    print("Inference result for German female customer (age 48, 3 products, inactive):")
    print(f"  - Probability: {result['churn_probability_pct']}%")
    print(f"  - Risk Tier: {result['risk_category']}")

