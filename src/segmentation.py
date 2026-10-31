"""
Customer Segmentation Module for European Banking Churn Analytics.
"""

from typing import Dict, List, Any, Optional
import pandas as pd
import numpy as np
from src.preprocessing import add_segment_features


def compute_segment_table(df: pd.DataFrame, segment_col: str, sort_by_count: bool = False) -> pd.DataFrame:
    """
    Compute structured metrics for a specific customer segmentation column:
    - Customer Count
    - Churned Customer Count
    - Churn Rate (%)
    - Contribution to Total Churn (%)
    - Retention Rate (%)
    - Average Balance ($)
    - Average Credit Score
    """
    if segment_col not in df.columns or "Exited" not in df.columns or len(df) == 0:
        return pd.DataFrame()

    total_churn_in_df = df["Exited"].sum()

    grouped = df.groupby(segment_col, observed=False).agg(
        Customer_Count=("Exited", "count"),
        Churned_Count=("Exited", "sum"),
        Mean_Churn=("Exited", "mean"),
        Avg_Balance=("Balance", "mean"),
        Avg_Credit_Score=("CreditScore", "mean"),
        Avg_Age=("Age", "mean")
    ).reset_index()

    grouped["Churn_Rate_Pct"] = (grouped["Mean_Churn"] * 100).round(2)
    grouped["Retention_Rate_Pct"] = (100 - grouped["Churn_Rate_Pct"]).round(2)
    grouped["Churn_Contribution_Pct"] = (
        (grouped["Churned_Count"] / total_churn_in_df * 100).round(2)
        if total_churn_in_df > 0 else 0.0
    )
    grouped["Avg_Balance"] = grouped["Avg_Balance"].round(2)
    grouped["Avg_Credit_Score"] = grouped["Avg_Credit_Score"].round(1)
    grouped["Avg_Age"] = grouped["Avg_Age"].round(1)

    grouped.drop(columns=["Mean_Churn"], inplace=True)

    if sort_by_count:
        grouped.sort_values(by="Customer_Count", ascending=False, inplace=True)

    return grouped


def get_all_segmentations(df: pd.DataFrame) -> Dict[str, pd.DataFrame]:
    """
    Compute standard segmentations across all required dimensions:
    - Geography
    - Age Group
    - Credit Score Tier
    - Tenure Group
    - Balance Tier
    - Engagement Status
    - Number of Products
    - Gender
    """
    df_seg = add_segment_features(df)

    segment_dimensions = {
        "Geography": "Geography",
        "Age Group": "AgeGroup",
        "Credit Score": "CreditTier",
        "Tenure": "TenureGroup",
        "Account Balance": "BalanceTier",
        "Engagement": "EngagementStatus",
        "Products Count": "NumOfProducts",
        "Gender": "Gender",
    }

    results = {}
    for label, col in segment_dimensions.items():
        results[label] = compute_segment_table(df_seg, col)

    return results


def get_multidimensional_segment_matrix(df: pd.DataFrame, dim1: str, dim2: str) -> pd.DataFrame:
    """
    Generate a 2D cross-tabulation of churn rates between two categorical dimensions.
    Useful for heatmaps (e.g. Geography vs Age Group, or Products vs Balance).
    """
    df_seg = add_segment_features(df)
    if dim1 not in df_seg.columns or dim2 not in df_seg.columns or "Exited" not in df_seg.columns:
        return pd.DataFrame()

    pivot = df_seg.pivot_table(
        index=dim1,
        columns=dim2,
        values="Exited",
        aggfunc=lambda x: round(np.mean(x) * 100, 2),
        observed=False
    )
    return pivot


def filter_high_value_customers(
    df: pd.DataFrame,
    min_balance: float = 100000.0,
    min_products: int = 1,
    min_credit_score: int = 670,
    active_only: bool = False,
    older_only: bool = False
) -> pd.DataFrame:
    """
    Filter dataset down to high-value customer personas based on custom criteria.
    """
    df_seg = add_segment_features(df)
    mask = (df_seg["Balance"] >= min_balance) & (df_seg["NumOfProducts"] >= min_products) & (df_seg["CreditScore"] >= min_credit_score)

    if active_only:
        mask = mask & (df_seg["IsActiveMember"] == 1)
    if older_only:
        mask = mask & (df_seg["Age"] >= 45)

    return df_seg[mask].copy()


def get_high_value_archetypes(df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
    """
    Calculate KPIs for pre-defined high-value customer archetypes:
    1. Premier Depositors (Balance > 120,000)
    2. Multi-Product Investors (NumOfProducts >= 2 & Balance > 50,000)
    3. Senior Wealth (Age >= 50 & Balance > 100,000)
    4. Prime Credit Active (CreditScore >= 750 & IsActiveMember == 1)
    """
    df_seg = add_segment_features(df)
    archetypes = {
        "Premier Depositors (Balance > $120k)": df_seg["Balance"] > 120000,
        "Multi-Product Investors (2+ Products & >$50k)": (df_seg["NumOfProducts"] >= 2) & (df_seg["Balance"] > 50000),
        "Senior Wealth Accounts (Age >= 50 & >$100k)": (df_seg["Age"] >= 50) & (df_seg["Balance"] > 100000),
        "Prime Credit Active (Credit >= 750 & Active)": (df_seg["CreditScore"] >= 750) & (df_seg["IsActiveMember"] == 1),
    }

    results = {}
    for name, mask in archetypes.items():
        subset = df_seg[mask]
        count = len(subset)
        churned = int(subset["Exited"].sum()) if count > 0 else 0
        rate = round((churned / count * 100), 2) if count > 0 else 0.0
        avg_bal = round(subset["Balance"].mean(), 2) if count > 0 else 0.0
        results[name] = {
            "customer_count": count,
            "churned_count": churned,
            "churn_rate": rate,
            "average_balance": avg_bal,
            "total_balance_at_risk": round(subset[subset["Exited"] == 1]["Balance"].sum(), 2) if count > 0 else 0.0
        }

    return results
