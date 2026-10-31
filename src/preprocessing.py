"""
Preprocessing and Feature Engineering Module for Bank Churn Analytics.
"""

from typing import Tuple, List, Dict, Any
import pandas as pd
import numpy as np


FEATURE_COLS_NUMERIC = [
    "CreditScore",
    "Age",
    "Tenure",
    "Balance",
    "NumOfProducts",
    "EstimatedSalary",
]

FEATURE_COLS_CATEGORICAL = [
    "Geography",
    "Gender",
]

FEATURE_COLS_BINARY = [
    "HasCrCard",
    "IsActiveMember",
]

IDENTIFIER_COLS = ["CustomerId", "Surname", "Year"]
TARGET_COL = "Exited"


def add_segment_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add human-interpretable segmentation columns to a customer dataframe.
    These are used for EDA, interactive filters, and segment aggregations.
    """
    df = df.copy()

    # Age Groups: Under 30, 30–45, 46–60, 60+
    age_bins = [-np.inf, 29, 45, 60, np.inf]
    age_labels = ["Under 30", "30–45", "46–60", "60+"]
    df["AgeGroup"] = pd.cut(df["Age"], bins=age_bins, labels=age_labels, right=True)

    # Credit Score Groups: Low (<580), Medium (580–669), High (670+)
    credit_bins = [-np.inf, 579, 669, np.inf]
    credit_labels = ["Low", "Medium", "High"]
    df["CreditTier"] = pd.cut(df["CreditScore"], bins=credit_bins, labels=credit_labels, right=True)

    # Tenure Groups: New (0-2), Mid-term (3-6), Long-term (7+)
    tenure_bins = [-np.inf, 2, 6, np.inf]
    tenure_labels = ["New customers", "Mid-term customers", "Long-term customers"]
    df["TenureGroup"] = pd.cut(df["Tenure"], bins=tenure_bins, labels=tenure_labels, right=True)

    # Balance Groups: Zero (0), Low (1-100k), High (>100k)
    # Using small epsilon to cleanly separate 0 from low balances
    def classify_balance(bal):
        if bal == 0:
            return "Zero balance"
        elif bal <= 100000:
            return "Low balance"
        else:
            return "High balance"

    df["BalanceTier"] = df["Balance"].apply(classify_balance)
    # Categorical ordering
    df["BalanceTier"] = pd.Categorical(
        df["BalanceTier"],
        categories=["Zero balance", "Low balance", "High balance"],
        ordered=True
    )

    # Engagement: Active (1), Inactive (0)
    df["EngagementStatus"] = df["IsActiveMember"].apply(
        lambda x: "Active customers" if x == 1 else "Inactive customers"
    )

    # Has Credit Card label
    df["CreditCardStatus"] = df["HasCrCard"].apply(
        lambda x: "Has Credit Card" if x == 1 else "No Credit Card"
    )

    # Churn Label
    if TARGET_COL in df.columns:
        df["ChurnStatus"] = df[TARGET_COL].apply(
            lambda x: "Churned" if x == 1 else "Retained"
        )

    return df


def get_feature_target_split(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Extract strictly valid model features X and target y,
    excluding customer identifiers and target variable.
    """
    df_clean = df.copy()

    # Drop non-feature columns
    cols_to_drop = [c for c in IDENTIFIER_COLS if c in df_clean.columns]
    if TARGET_COL in df_clean.columns:
        cols_to_drop.append(TARGET_COL)

    # Drop any temporary segmentation columns if present
    extra_segment_cols = [
        "AgeGroup", "CreditTier", "TenureGroup", "BalanceTier",
        "EngagementStatus", "CreditCardStatus", "ChurnStatus"
    ]
    cols_to_drop.extend([c for c in extra_segment_cols if c in df_clean.columns])

    X = df_clean.drop(columns=cols_to_drop, errors="ignore")
    y = df[TARGET_COL].copy() if TARGET_COL in df.columns else None

    # Keep only defined input features
    feature_columns = FEATURE_COLS_NUMERIC + FEATURE_COLS_CATEGORICAL + FEATURE_COLS_BINARY
    X = X[[col for col in feature_columns if col in X.columns]]

    return X, y


def build_preprocessor():
    """
    Construct a scikit-learn ColumnTransformer that scales numerical
    features and one-hot encodes categorical features.
    """
    from sklearn.compose import ColumnTransformer
    from sklearn.preprocessing import StandardScaler, OneHotEncoder

    numeric_transformer = StandardScaler()
    categorical_transformer = OneHotEncoder(drop="first", sparse_output=False, handle_unknown="ignore")

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, FEATURE_COLS_NUMERIC),
            ("cat", categorical_transformer, FEATURE_COLS_CATEGORICAL),
            ("bin", "passthrough", FEATURE_COLS_BINARY),
        ],
        remainder="drop"
    )
    return preprocessor


def get_feature_names(preprocessor) -> List[str]:
    """
    Extract readable feature names after ColumnTransformer transformation.
    """
    num_names = FEATURE_COLS_NUMERIC
    cat_encoder = preprocessor.named_transformers_["cat"]
    cat_names = list(cat_encoder.get_feature_names_out(FEATURE_COLS_CATEGORICAL))
    bin_names = FEATURE_COLS_BINARY
    return num_names + cat_names + bin_names


def prepare_train_test_data(
    df: pd.DataFrame,
    test_size: float = 0.2,
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Perform stratified train-test split and fit preprocessor on training data only.
    Prevents data leakage.
    """
    from sklearn.model_selection import train_test_split

    X, y = get_feature_target_split(df)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=test_size,
        random_state=random_state,
        stratify=y
    )

    preprocessor = build_preprocessor()
    X_train_trans = preprocessor.fit_transform(X_train)
    X_test_trans = preprocessor.transform(X_test)

    feature_names = get_feature_names(preprocessor)
    X_train_df = pd.DataFrame(X_train_trans, columns=feature_names, index=X_train.index)
    X_test_df = pd.DataFrame(X_test_trans, columns=feature_names, index=X_test.index)

    return {
        "X_train_raw": X_train,
        "X_test_raw": X_test,
        "X_train": X_train_df,
        "X_test": X_test_df,
        "y_train": y_train,
        "y_test": y_test,
        "preprocessor": preprocessor,
        "feature_names": feature_names,
    }
