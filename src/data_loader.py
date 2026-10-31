"""
Data Ingestion and Validation Module for European Banking Churn Analytics.
"""

from pathlib import Path
from typing import Dict, Any, Tuple
import pandas as pd
import numpy as np

DEFAULT_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "bank_churn.csv"


def load_data(filepath: str | Path | None = None) -> pd.DataFrame:
    """
    Load the bank churn dataset from a CSV file.

    Parameters
    ----------
    filepath : str | Path | None
        Path to the CSV file. If None, uses DEFAULT_DATA_PATH.

    Returns
    -------
    pd.DataFrame
        Loaded raw bank customer churn dataframe.
    """
    path = Path(filepath) if filepath else DEFAULT_DATA_PATH
    if not path.exists():
        raise FileNotFoundError(f"Dataset file not found at: {path}")

    df = pd.read_csv(path)
    return df


def validate_data(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Perform rigorous data quality validation and summary.

    Parameters
    ----------
    df : pd.DataFrame
        Input customer dataframe.

    Returns
    -------
    Dict[str, Any]
        Dictionary containing quality metrics and validation results.
    """
    target_col = "Exited"
    has_target = target_col in df.columns

    target_stats: Dict[str, Any] = {}
    if has_target:
        counts = df[target_col].value_counts().to_dict()
        proportions = df[target_col].value_counts(normalize=True).to_dict()
        target_stats = {
            "target_column": target_col,
            "unique_values": sorted(list(df[target_col].unique())),
            "counts": counts,
            "proportions": proportions,
            "churn_count": int(counts.get(1, 0)),
            "retained_count": int(counts.get(0, 0)),
            "churn_rate": float(proportions.get(1, 0.0)),
            "retention_rate": float(proportions.get(0, 0.0)),
            "is_binary": set(df[target_col].unique()).issubset({0, 1}),
        }

    missing_per_col = df.isnull().sum().to_dict()
    total_missing = int(df.isnull().sum().sum())
    duplicate_rows = int(df.duplicated().sum())
    duplicate_ids = int(df["CustomerId"].duplicated().sum()) if "CustomerId" in df.columns else 0

    col_dtypes = {col: str(dtype) for col, dtype in df.dtypes.items()}

    numerical_summary = df.describe().to_dict()

    summary: Dict[str, Any] = {
        "shape": {"rows": df.shape[0], "columns": df.shape[1]},
        "columns": list(df.columns),
        "data_types": col_dtypes,
        "missing_values": {
            "total_missing": total_missing,
            "by_column": missing_per_col,
            "has_missing": total_missing > 0,
        },
        "duplicate_records": {
            "total_duplicate_rows": duplicate_rows,
            "duplicate_customer_ids": duplicate_ids,
        },
        "target_validation": target_stats,
        "numerical_summary": numerical_summary,
        "geographies": list(df["Geography"].unique()) if "Geography" in df.columns else [],
        "genders": list(df["Gender"].unique()) if "Gender" in df.columns else [],
    }

    return summary


def get_data_quality_report(df: pd.DataFrame) -> pd.DataFrame:
    """
    Generate a tabular data quality summary for each column.
    """
    report = []
    for col in df.columns:
        report.append({
            "Column": col,
            "Data Type": str(df[col].dtype),
            "Non-Null Count": df[col].notnull().sum(),
            "Null Count": df[col].isnull().sum(),
            "Null %": round((df[col].isnull().sum() / len(df)) * 100, 2),
            "Unique Values": df[col].nunique(),
            "Sample Value": str(df[col].iloc[0]) if len(df) > 0 else "N/A"
        })
    return pd.DataFrame(report)


if __name__ == "__main__":
    df = load_data()
    summary = validate_data(df)
    print(f"Dataset successfully loaded. Shape: {summary['shape']['rows']} rows, {summary['shape']['columns']} columns.")
    print(f"Missing values: {summary['missing_values']['total_missing']}")
    print(f"Duplicates: {summary['duplicate_records']['total_duplicate_rows']}")
    print(f"Target stats: {summary['target_validation']}")
