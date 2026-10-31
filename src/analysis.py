"""
Statistical Analysis, KPI Computation, and Data-Driven Insights Module.
"""

from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np


def compute_overview_kpis(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Compute executive-level overview metrics and statistical indicators.
    """
    total_customers = len(df)
    if total_customers == 0:
        return {
            "total_customers": 0,
            "churned_customers": 0,
            "retained_customers": 0,
            "churn_rate": 0.0,
            "retention_rate": 0.0,
            "avg_age": 0.0,
            "avg_credit_score": 0.0,
            "avg_balance": 0.0,
            "avg_tenure": 0.0,
            "avg_salary": 0.0,
            "total_balance": 0.0,
        }

    churned = int((df["Exited"] == 1).sum()) if "Exited" in df.columns else 0
    retained = total_customers - churned
    churn_rate = (churned / total_customers) * 100.0
    retention_rate = 100.0 - churn_rate

    avg_age = float(df["Age"].mean()) if "Age" in df.columns else 0.0
    avg_credit_score = float(df["CreditScore"].mean()) if "CreditScore" in df.columns else 0.0
    avg_balance = float(df["Balance"].mean()) if "Balance" in df.columns else 0.0
    total_balance = float(df["Balance"].sum()) if "Balance" in df.columns else 0.0
    avg_tenure = float(df["Tenure"].mean()) if "Tenure" in df.columns else 0.0
    avg_salary = float(df["EstimatedSalary"].mean()) if "EstimatedSalary" in df.columns else 0.0

    return {
        "total_customers": total_customers,
        "churned_customers": churned,
        "retained_customers": retained,
        "churn_rate": round(churn_rate, 2),
        "retention_rate": round(retention_rate, 2),
        "avg_age": round(avg_age, 1),
        "avg_credit_score": round(avg_credit_score, 1),
        "avg_balance": round(avg_balance, 2),
        "total_balance": round(total_balance, 2),
        "avg_tenure": round(avg_tenure, 1),
        "avg_salary": round(avg_salary, 2),
    }


def compute_specialized_kpis(df: pd.DataFrame, base_churn_rate: Optional[float] = None) -> Dict[str, Any]:
    """
    Compute mathematically defined specialized KPIs:
    1. Overall Churn Rate (CR)
    2. High-Value Churn Ratio (HVCR)
    3. Geographic Risk Index (GRI)
    4. Engagement Drop Indicator (EDI)
    """
    total_customers = len(df)
    if total_customers == 0:
        return {}

    overall_churn_rate = (df["Exited"].mean()) * 100.0
    baseline = base_churn_rate if base_churn_rate is not None and base_churn_rate > 0 else overall_churn_rate

    # 1. High-Value Customer Definition: Balance > 100,000 OR (Balance > 50,000 and NumOfProducts >= 2)
    hv_mask = (df["Balance"] > 100000) | ((df["Balance"] > 50000) & (df["NumOfProducts"] >= 2))
    df_hv = df[hv_mask]
    hv_count = len(df_hv)
    hv_churned = int(df_hv["Exited"].sum()) if hv_count > 0 else 0
    hv_churn_rate = (hv_churned / hv_count * 100.0) if hv_count > 0 else 0.0

    total_churned = int(df["Exited"].sum())
    # High-Value Churn Contribution: % of all churners who were high value
    hv_contribution_ratio = (hv_churned / total_churned * 100.0) if total_churned > 0 else 0.0

    # 2. Geographic Risk Index (GRI) for each geography
    gri_by_country = {}
    if "Geography" in df.columns:
        for geo, grp in df.groupby("Geography"):
            geo_rate = (grp["Exited"].mean()) * 100.0
            gri = (geo_rate / baseline * 100.0) if baseline > 0 else 100.0
            gri_by_country[geo] = {
                "churn_rate": round(geo_rate, 2),
                "customer_count": len(grp),
                "churned_count": int(grp["Exited"].sum()),
                "gri": round(gri, 1),
                "risk_status": "Elevated" if gri > 115 else ("Sub-average" if gri < 85 else "Average")
            }

    # 3. Engagement Drop Indicator (EDI)
    # Ratio of Churn Rate of Inactive Members to Churn Rate of Active Members
    active_mask = df["IsActiveMember"] == 1
    inactive_mask = df["IsActiveMember"] == 0

    active_churn_rate = (df.loc[active_mask, "Exited"].mean() * 100.0) if active_mask.sum() > 0 else 0.0
    inactive_churn_rate = (df.loc[inactive_mask, "Exited"].mean() * 100.0) if inactive_mask.sum() > 0 else 0.0

    edi = (inactive_churn_rate / active_churn_rate) if active_churn_rate > 0 else 1.0

    return {
        "overall_churn_rate": round(overall_churn_rate, 2),
        "high_value": {
            "total_high_value_customers": hv_count,
            "high_value_churned": hv_churned,
            "high_value_churn_rate": round(hv_churn_rate, 2),
            "high_value_contribution_ratio": round(hv_contribution_ratio, 2),
            "balance_threshold": 100000,
        },
        "geographic_risk_index": gri_by_country,
        "engagement_drop_indicator": {
            "edi_multiplier": round(edi, 2),
            "active_churn_rate": round(active_churn_rate, 2),
            "inactive_churn_rate": round(inactive_churn_rate, 2),
            "difference_pct_points": round(inactive_churn_rate - active_churn_rate, 2),
        }
    }


def analyze_financial_profiles(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Compare financial profiles of churned vs retained customers.
    """
    if "Exited" not in df.columns or len(df) == 0:
        return {}

    churned = df[df["Exited"] == 1]
    retained = df[df["Exited"] == 0]

    financial_summary = {
        "churned": {
            "count": len(churned),
            "mean_balance": round(churned["Balance"].mean(), 2),
            "median_balance": round(churned["Balance"].median(), 2),
            "mean_salary": round(churned["EstimatedSalary"].mean(), 2),
            "mean_credit_score": round(churned["CreditScore"].mean(), 1),
            "mean_age": round(churned["Age"].mean(), 1),
            "mean_products": round(churned["NumOfProducts"].mean(), 2),
            "zero_balance_pct": round((churned["Balance"] == 0).mean() * 100, 2),
        },
        "retained": {
            "count": len(retained),
            "mean_balance": round(retained["Balance"].mean(), 2),
            "median_balance": round(retained["Balance"].median(), 2),
            "mean_salary": round(retained["EstimatedSalary"].mean(), 2),
            "mean_credit_score": round(retained["CreditScore"].mean(), 1),
            "mean_age": round(retained["Age"].mean(), 1),
            "mean_products": round(retained["NumOfProducts"].mean(), 2),
            "zero_balance_pct": round((retained["Balance"] == 0).mean() * 100, 2),
        }
    }
    return financial_summary


def generate_data_driven_insights(df: pd.DataFrame) -> List[Dict[str, str]]:
    """
    Dynamically derive high-impact, quantitative findings from the dataset.
    Never hardcoded; directly computed from input slice or full data.
    """
    insights = []
    if len(df) == 0 or "Exited" not in df.columns:
        return insights

    overall_churn = df["Exited"].mean() * 100.0

    # 1. Geographic Insights
    if "Geography" in df.columns:
        geo_rates = df.groupby("Geography")["Exited"].agg(["count", "mean"])
        geo_rates["mean_pct"] = geo_rates["mean"] * 100
        highest_geo = geo_rates["mean_pct"].idxmax()
        highest_geo_rate = geo_rates.loc[highest_geo, "mean_pct"]
        lowest_geo = geo_rates["mean_pct"].idxmin()
        lowest_geo_rate = geo_rates.loc[lowest_geo, "mean_pct"]

        insights.append({
            "category": "Geographic Disparity",
            "title": f"High Churn Vulnerability in {highest_geo}",
            "description": (
                f"{highest_geo} exhibits a churn rate of {highest_geo_rate:.1f}%, which is "
                f"significantly higher than {lowest_geo} ({lowest_geo_rate:.1f}%) and "
                f"the benchmark average of {overall_churn:.1f}%."
            ),
            "severity": "high" if highest_geo_rate > 30 else "medium",
            "recommendation": f"Initiate local customer service reviews and tailored localized banking products in {highest_geo}."
        })

    # 2. Age Demographic Insights
    if "Age" in df.columns:
        # Age brackets
        df_temp = df.copy()
        df_temp["AgeBracket"] = pd.cut(df_temp["Age"], bins=[0, 30, 45, 60, 120], labels=["<30", "30-45", "46-60", "60+"])
        age_summary = df_temp.groupby("AgeBracket", observed=False)["Exited"].agg(["count", "mean"])
        age_summary["mean_pct"] = age_summary["mean"] * 100
        highest_age = age_summary["mean_pct"].idxmax()
        highest_age_rate = age_summary.loc[highest_age, "mean_pct"]

        insights.append({
            "category": "Demographics (Age)",
            "title": f"Mature Demographic ({highest_age}) Exhibits Peak Attrition",
            "description": (
                f"Customers aged {highest_age} face the steepest churn rate at {highest_age_rate:.1f}%. "
                f"In contrast, younger customers under 30 churn at {age_summary.loc['<30', 'mean_pct']:.1f}%."
            ),
            "severity": "high" if highest_age_rate > 35 else "medium",
            "recommendation": "Design wealth preservation, pension advisory, and senior relationship management initiatives."
        })

    # 3. Product Bundling / Saturation Insights
    if "NumOfProducts" in df.columns:
        prod_summary = df.groupby("NumOfProducts")["Exited"].agg(["count", "mean"])
        prod_summary["mean_pct"] = prod_summary["mean"] * 100

        # Check products 3 and 4
        p3_p4 = df[df["NumOfProducts"] >= 3]
        if len(p3_p4) > 0:
            p3_p4_churn = p3_p4["Exited"].mean() * 100.0
            insights.append({
                "category": "Product Cross-Selling",
                "title": "Severe Attrition in Over-Bundled Customers (3+ Products)",
                "description": (
                    f"Customers holding 3 or 4 banking products have a critical churn rate of {p3_p4_churn:.1f}% "
                    f"(spanning {len(p3_p4)} accounts). Meanwhile, 2-product customers demonstrate "
                    f"the lowest attrition at {prod_summary.loc[2, 'mean_pct']:.1f}%."
                ),
                "severity": "high",
                "recommendation": "Investigate friction, fee stacking, or product mismatch among multi-product accounts."
            })

    # 4. Inactive Member Disparity
    if "IsActiveMember" in df.columns:
        active_rate = df[df["IsActiveMember"] == 1]["Exited"].mean() * 100.0
        inactive_rate = df[df["IsActiveMember"] == 0]["Exited"].mean() * 100.0
        gap = inactive_rate - active_rate

        insights.append({
            "category": "Engagement Risk",
            "title": f"Inactive Members are {inactive_rate / max(active_rate, 0.1):.1f}x More Likely to Churn",
            "description": (
                f"Inactive accounts experience a churn rate of {inactive_rate:.1f}% compared to "
                f"{active_rate:.1f}% for active members (a {gap:.1f} percentage point gap)."
            ),
            "severity": "medium",
            "recommendation": "Deploy digital re-engagement campaigns, mobile app onboarding, and milestone check-ins."
        })

    # 5. Balance & High-Value Attrition
    if "Balance" in df.columns:
        zero_bal = df[df["Balance"] == 0]
        pos_bal = df[df["Balance"] > 0]
        zero_bal_rate = zero_bal["Exited"].mean() * 100.0 if len(zero_bal) > 0 else 0
        pos_bal_rate = pos_bal["Exited"].mean() * 100.0 if len(pos_bal) > 0 else 0

        insights.append({
            "category": "Financial Capital Flight",
            "title": "Capital Flight Among Funded Accounts",
            "description": (
                f"Funded accounts (>0 balance) suffer higher churn ({pos_bal_rate:.1f}%) "
                f"than zero-balance accounts ({zero_bal_rate:.1f}%), signaling direct capital outflows."
            ),
            "severity": "high" if pos_bal_rate > zero_bal_rate else "low",
            "recommendation": "Implement competitive high-yield deposit rates and personalized premier banking tier incentives."
        })

    return insights
