"""
Helper script to generate the complete, valid churn_analysis.ipynb notebook.
"""
import json
from pathlib import Path

notebook = {
    "cells": [
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "# Customer Segmentation & Churn Pattern Analytics in European Banking\n",
                "## End-to-End Empirical Data Science and Machine Learning Analysis\n",
                "\n",
                "**Dataset:** European Banking Churn Dataset (10,000 customers across France, Germany, Spain)\n",
                "**Target:** `Exited` (0 = Retained, 1 = Churned)"
            ]
        },
        {
            "cell_type": "code",
            "execution_count": 1,
            "metadata": {},
            "outputs": [],
            "source": [
                "import os\n",
                "import sys\n",
                "from pathlib import Path\n",
                "import numpy as np\n",
                "import pandas as pd\n",
                "import matplotlib.pyplot as plt\n",
                "import seaborn as sns\n",
                "\n",
                "# Set plot styles\n",
                "plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')\n",
                "sns.set_palette('deep')\n",
                "pd.set_option('display.max_columns', None)\n",
                "pd.set_option('display.width', 1000)\n",
                "\n",
                "# Project root\n",
                "ROOT_DIR = Path.cwd().parent if Path.cwd().name == 'notebooks' else Path.cwd()\n",
                "if str(ROOT_DIR) not in sys.path:\n",
                "    sys.path.append(str(ROOT_DIR))\n",
                "\n",
                "from src.data_loader import load_data, validate_data, get_data_quality_report\n",
                "from src.preprocessing import add_segment_features, prepare_train_test_data\n",
                "from src.analysis import compute_overview_kpis, compute_specialized_kpis, generate_data_driven_insights\n",
                "from src.segmentation import get_all_segmentations, get_high_value_archetypes\n",
                "from src.model import train_models, evaluate_model, compare_and_select_best_model\n",
                "\n",
                "print('All modules loaded successfully.')"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## 1. Data Ingestion & Quality Validation"
            ]
        },
        {
            "cell_type": "code",
            "execution_count": 2,
            "metadata": {},
            "outputs": [],
            "source": [
                "data_path = ROOT_DIR / 'data' / 'bank_churn.csv'\n",
                "df = load_data(data_path)\n",
                "quality_summary = validate_data(df)\n",
                "\n",
                "print(f\"Dataset Shape: {df.shape[0]} rows, {df.shape[1]} columns\")\n",
                "print(f\"Total Missing Values: {quality_summary['missing_values']['total_missing']}\")\n",
                "print(f\"Duplicate Customer IDs: {quality_summary['duplicate_records']['duplicate_customer_ids']}\")\n",
                "print(f\"Target Distribution: {quality_summary['target_validation']['counts']}\")\n",
                "print(f\"Overall Churn Rate: {quality_summary['target_validation']['churn_rate']*100:.2f}%\")\n",
                "\n",
                "quality_df = get_data_quality_report(df)\n",
                "quality_df"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## 2. Statistical Analysis & Executive KPIs"
            ]
        },
        {
            "cell_type": "code",
            "execution_count": 3,
            "metadata": {},
            "outputs": [],
            "source": [
                "kpis = compute_overview_kpis(df)\n",
                "specialized = compute_specialized_kpis(df)\n",
                "\n",
                "print('=== EXECUTIVE KPIS ===')\n",
                "for k, v in kpis.items():\n",
                "    print(f\"{k:25}: {v}\")\n",
                "\n",
                "print('\\n=== SPECIALIZED KPIS ===')\n",
                "print(f\"Engagement Drop Indicator (EDI): {specialized['engagement_drop_indicator']['edi_multiplier']}x\")\n",
                "print(f\"Active Churn Rate: {specialized['engagement_drop_indicator']['active_churn_rate']}%\")\n",
                "print(f\"Inactive Churn Rate: {specialized['engagement_drop_indicator']['inactive_churn_rate']}%\")\n",
                "print(f\"High-Value Customer Churn Rate: {specialized['high_value']['high_value_churn_rate']}%\")\n",
                "print(f\"High-Value Churn Contribution: {specialized['high_value']['high_value_contribution_ratio']}%\")"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## 3. Exploratory Data Analysis Visualizations"
            ]
        },
        {
            "cell_type": "code",
            "execution_count": 4,
            "metadata": {},
            "outputs": [],
            "source": [
                "df_seg = add_segment_features(df)\n",
                "\n",
                "fig, axes = plt.subplots(2, 3, figsize=(18, 10))\n",
                "\n",
                "# 1. Geography Churn Rate\n",
                "geo_churn = df.groupby('Geography')['Exited'].mean() * 100\n",
                "sns.barplot(x=geo_churn.index, y=geo_churn.values, ax=axes[0, 0], palette='Blues_d')\n",
                "axes[0, 0].set_title('Churn Rate by Geography (%)', fontsize=12, fontweight='bold')\n",
                "axes[0, 0].set_ylabel('Churn Rate (%)')\n",
                "\n",
                "# 2. Age Group Churn Rate\n",
                "age_churn = df_seg.groupby('AgeGroup', observed=False)['Exited'].mean() * 100\n",
                "sns.barplot(x=age_churn.index, y=age_churn.values, ax=axes[0, 1], palette='Reds_d')\n",
                "axes[0, 1].set_title('Churn Rate by Age Group (%)', fontsize=12, fontweight='bold')\n",
                "axes[0, 1].set_ylabel('Churn Rate (%)')\n",
                "\n",
                "# 3. Products Count Churn Rate\n",
                "prod_churn = df.groupby('NumOfProducts')['Exited'].mean() * 100\n",
                "sns.barplot(x=prod_churn.index, y=prod_churn.values, ax=axes[0, 2], palette='Purples_d')\n",
                "axes[0, 2].set_title('Churn Rate by Number of Products (%)', fontsize=12, fontweight='bold')\n",
                "axes[0, 2].set_ylabel('Churn Rate (%)')\n",
                "\n",
                "# 4. Active Membership\n",
                "act_churn = df_seg.groupby('EngagementStatus')['Exited'].mean() * 100\n",
                "sns.barplot(x=act_churn.index, y=act_churn.values, ax=axes[1, 0], palette='Greens_d')\n",
                "axes[1, 0].set_title('Churn Rate by Active Membership (%)', fontsize=12, fontweight='bold')\n",
                "axes[1, 0].set_ylabel('Churn Rate (%)')\n",
                "\n",
                "# 5. Balance Distribution by Churn Status\n",
                "sns.boxplot(data=df_seg, x='ChurnStatus', y='Balance', ax=axes[1, 1], palette='Set2')\n",
                "axes[1, 1].set_title('Account Balance Distribution by Churn Status', fontsize=12, fontweight='bold')\n",
                "\n",
                "# 6. Gender Disparity\n",
                "gender_churn = df.groupby('Gender')['Exited'].mean() * 100\n",
                "sns.barplot(x=gender_churn.index, y=gender_churn.values, ax=axes[1, 2], palette='Oranges_d')\n",
                "axes[1, 2].set_title('Churn Rate by Gender (%)', fontsize=12, fontweight='bold')\n",
                "axes[1, 2].set_ylabel('Churn Rate (%)')\n",
                "\n",
                "plt.tight_layout()\n",
                "plt.show()"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## 4. Customer Segmentation & Cohort Profiling"
            ]
        },
        {
            "cell_type": "code",
            "execution_count": 5,
            "metadata": {},
            "outputs": [],
            "source": [
                "all_segs = get_all_segmentations(df)\n",
                "print('=== GEOGRAPHIC SEGMENTS ===')\n",
                "print(all_segs['Geography'])\n",
                "\n",
                "print('\\n=== AGE GROUP SEGMENTS ===')\n",
                "print(all_segs['Age Group'])\n",
                "\n",
                "print('\\n=== HIGH-VALUE ARCHETYPES ===')\n",
                "archetypes = get_high_value_archetypes(df)\n",
                "archetype_df = pd.DataFrame(archetypes).T\n",
                "archetype_df"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## 5. Machine Learning Modeling & Comparative Evaluation"
            ]
        },
        {
            "cell_type": "code",
            "execution_count": 6,
            "metadata": {},
            "outputs": [],
            "source": [
                "split_data = prepare_train_test_data(df, test_size=0.2, random_state=42)\n",
                "X_train = split_data['X_train']\n",
                "X_test = split_data['X_test']\n",
                "y_train = split_data['y_train']\n",
                "y_test = split_data['y_test']\n",
                "feature_names = split_data['feature_names']\n",
                "\n",
                "# Train models\n",
                "models = train_models(X_train, y_train, random_state=42)\n",
                "\n",
                "evaluations = {}\n",
                "for name, model in models.items():\n",
                "    evaluations[name] = evaluate_model(model, X_test, y_test, feature_names)\n",
                "\n",
                "best_model_name, comparison_df = compare_and_select_best_model(evaluations, primary_metric='ROC-AUC')\n",
                "print(f\"Best Performing Model: {best_model_name}\")\n",
                "comparison_df"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## 6. Confusion Matrix & Feature Importance"
            ]
        },
        {
            "cell_type": "code",
            "execution_count": 7,
            "metadata": {},
            "outputs": [],
            "source": [
                "rf_eval = evaluations['Random Forest']\n",
                "cm = np.array(rf_eval['confusion_matrix'])\n",
                "\n",
                "fig, axes = plt.subplots(1, 2, figsize=(15, 5))\n",
                "\n",
                "# Confusion Matrix\n",
                "sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=axes[0],\n",
                "            xticklabels=['Retained (0)', 'Churned (1)'],\n",
                "            yticklabels=['Retained (0)', 'Churned (1)'])\n",
                "axes[0].set_title('Random Forest - Test Confusion Matrix', fontsize=12, fontweight='bold')\n",
                "axes[0].set_xlabel('Predicted Label')\n",
                "axes[0].set_ylabel('True Label')\n",
                "\n",
                "# Feature Importance\n",
                "feat_df = pd.DataFrame(rf_eval['feature_importance'])\n",
                "sns.barplot(data=feat_df, x='Importance', y='Feature', ax=axes[1], palette='viridis')\n",
                "axes[1].set_title('Random Forest - Feature Importance', fontsize=12, fontweight='bold')\n",
                "\n",
                "plt.tight_layout()\n",
                "plt.show()"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## 7. Automated Data-Driven Insights"
            ]
        },
        {
            "cell_type": "code",
            "execution_count": 8,
            "metadata": {},
            "outputs": [],
            "source": [
                "insights = generate_data_driven_insights(df)\n",
                "for idx, ins in enumerate(insights, 1):\n",
                "    print(f\"{idx}. [{ins['category']}] {ins['title']}\")\n",
                "    print(f\"   Finding: {ins['description']}\")\n",
                "    print(f\"   Recommendation: {ins['recommendation']}\\n\")"
            ]
        }
    ],
    "metadata": {
        "language_info": {
            "name": "python"
        }
    },
    "nbformat": 4,
    "nbformat_minor": 2
}

output_path = Path(r"C:\Users\ashis\.gemini\antigravity\scratch\bank-churn-analytics\notebooks\churn_analysis.ipynb")
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(notebook, f, indent=2)

print("Notebook generated successfully at:", output_path)
