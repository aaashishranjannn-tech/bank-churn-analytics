"""
European Retail Banking - Customer Segmentation & Churn Analytics Dashboard.
Interactive Streamlit Application.
"""

from pathlib import Path
import sys
import pandas as pd
import numpy as np
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from src.data_loader import load_data, validate_data
from src.preprocessing import add_segment_features
from src.analysis import (
    compute_overview_kpis,
    compute_specialized_kpis,
    analyze_financial_profiles,
    generate_data_driven_insights,
)
from src.segmentation import (
    get_all_segmentations,
    get_multidimensional_segment_matrix,
    get_high_value_archetypes,
)
from src.model import (
    load_model_bundle,
    train_and_save_pipeline,
    predict_churn_single,
    MODEL_PATH,
)

# ---------------------------------------------------------
# Page Configuration & Navy/Blue Theme Styling
# ---------------------------------------------------------
st.set_page_config(
    page_title="European Banking | Churn Analytics",
    page_icon="🏦",
    layout="wide",
    initial_sidebar_state="expanded"
)

CUSTOM_CSS = """
<style>
    /* Dark Navy & Blue Executive Palette */
    .stApp {
        background-color: #0b111e;
        color: #e2e8f0;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    /* Top Header Bar */
    .main-header {
        background: linear-gradient(135deg, #0f1c3f 0%, #1e3a8a 100%);
        padding: 1.5rem 2rem;
        border-radius: 12px;
        margin-bottom: 1.5rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        border: 1px solid #1e40af;
    }
    .main-header h1 {
        color: #ffffff;
        font-size: 1.85rem;
        font-weight: 700;
        margin: 0;
        letter-spacing: -0.02em;
    }
    .main-header p {
        color: #93c5fd;
        font-size: 0.95rem;
        margin: 0.35rem 0 0 0;
    }

    /* KPI Cards */
    .kpi-card {
        background: #131d36;
        border: 1px solid #1e293b;
        border-radius: 10px;
        padding: 1.1rem 1.25rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        transition: transform 0.15s ease, border-color 0.15s ease;
    }
    .kpi-card:hover {
        border-color: #3b82f6;
        transform: translateY(-2px);
    }
    .kpi-title {
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #94a3b8;
        font-weight: 600;
        margin-bottom: 0.4rem;
    }
    .kpi-value {
        font-size: 1.75rem;
        font-weight: 700;
        color: #ffffff;
        line-height: 1.2;
    }
    .kpi-sub {
        font-size: 0.8rem;
        color: #64748b;
        margin-top: 0.35rem;
    }
    .kpi-danger { color: #f87171 !important; }
    .kpi-success { color: #34d399 !important; }
    .kpi-accent { color: #60a5fa !important; }

    /* Insight Banner */
    .insight-card {
        background: #111e38;
        border-left: 4px solid #3b82f6;
        padding: 1rem 1.25rem;
        border-radius: 0 8px 8px 0;
        margin-bottom: 0.75rem;
    }
    .insight-card.high-sev {
        border-left-color: #ef4444;
        background: #24141d;
    }
    .insight-title {
        font-size: 0.95rem;
        font-weight: 600;
        color: #f1f5f9;
        margin-bottom: 0.25rem;
    }
    .insight-desc {
        font-size: 0.85rem;
        color: #cbd5e1;
        line-height: 1.4;
    }
    .insight-rec {
        font-size: 0.82rem;
        color: #38bdf8;
        margin-top: 0.35rem;
        font-style: italic;
    }

    /* Prediction Card */
    .pred-card {
        background: #131e3b;
        border: 2px solid #2563eb;
        border-radius: 12px;
        padding: 1.5rem;
        text-align: center;
        margin-top: 1rem;
    }

    /* Sidebar adjustments */
    section[data-testid="stSidebar"] {
        background-color: #0d1527;
        border-right: 1px solid #1e293b;
    }
</style>
"""
st.markdown(CUSTOM_CSS, unsafe_allow_html=True)

# ---------------------------------------------------------
# Data & Model Caching
# ---------------------------------------------------------
@st.cache_data
def get_cached_data() -> pd.DataFrame:
    df_raw = load_data()
    return add_segment_features(df_raw)

@st.cache_resource
def get_or_train_model():
    if not MODEL_PATH.exists():
        bundle = train_and_save_pipeline()
    else:
        try:
            bundle = load_model_bundle()
        except Exception:
            bundle = train_and_save_pipeline()
    return bundle


df_full = get_cached_data()
model_bundle = get_or_train_model()
base_kpis = compute_overview_kpis(df_full)

# ---------------------------------------------------------
# Sidebar Navigation & Reactive Filters
# ---------------------------------------------------------
with st.sidebar:
    st.image("https://img.icons8.com/fluency/96/bank-building.png", width=64)
    st.markdown("### 🏦 **European Banking**\n*Churn Pattern Intelligence*")
    st.divider()

    st.markdown("#### 🎯 **Portfolio Filters**")

    # Reset Filters Button
    if st.button("🔄 Reset All Filters", use_container_width=True):
        st.session_state["filter_geo"] = ["France", "Germany", "Spain"]
        st.session_state["filter_gender"] = ["Female", "Male"]
        st.session_state["filter_age"] = (18, 92)
        st.session_state["filter_score"] = (350, 850)
        st.session_state["filter_balance"] = (0.0, 255000.0)
        st.session_state["filter_products"] = [1, 2, 3, 4]
        st.session_state["filter_active"] = "All"
        st.rerun()

    # Initialize session state defaults if absent
    if "filter_geo" not in st.session_state:
        st.session_state["filter_geo"] = ["France", "Germany", "Spain"]
    if "filter_gender" not in st.session_state:
        st.session_state["filter_gender"] = ["Female", "Male"]
    if "filter_age" not in st.session_state:
        st.session_state["filter_age"] = (18, 92)
    if "filter_score" not in st.session_state:
        st.session_state["filter_score"] = (350, 850)
    if "filter_balance" not in st.session_state:
        st.session_state["filter_balance"] = (0.0, 255000.0)
    if "filter_products" not in st.session_state:
        st.session_state["filter_products"] = [1, 2, 3, 4]
    if "filter_active" not in st.session_state:
        st.session_state["filter_active"] = "All"

    # Geography
    all_geos = ["France", "Germany", "Spain"]
    selected_geo = st.multiselect("Geography", options=all_geos, default=st.session_state["filter_geo"])

    # Gender
    selected_gender = st.multiselect("Gender", options=["Female", "Male"], default=st.session_state["filter_gender"])

    # Age Range
    selected_age = st.slider("Customer Age Range", 18, 92, st.session_state["filter_age"])

    # Credit Score
    selected_score = st.slider("Credit Score Range", 350, 850, st.session_state["filter_score"])

    # Balance Range
    selected_balance = st.slider("Account Balance ($)", 0.0, 255000.0, st.session_state["filter_balance"], step=5000.0)

    # Number of Products
    selected_products = st.multiselect("Bank Products Held", options=[1, 2, 3, 4], default=st.session_state["filter_products"])

    # Active Member
    selected_active = st.selectbox("Engagement Status", options=["All", "Active Only", "Inactive Only"], index=0)

    st.divider()
    st.caption("European Bank Analytics Suite v2.0\nML Pipeline: Stratified Balanced Random Forest")

# ---------------------------------------------------------
# Apply Reactive Filtering
# ---------------------------------------------------------
filtered_df = df_full.copy()

if selected_geo:
    filtered_df = filtered_df[filtered_df["Geography"].isin(selected_geo)]
if selected_gender:
    filtered_df = filtered_df[filtered_df["Gender"].isin(selected_gender)]
filtered_df = filtered_df[
    (filtered_df["Age"] >= selected_age[0]) & (filtered_df["Age"] <= selected_age[1])
]
filtered_df = filtered_df[
    (filtered_df["CreditScore"] >= selected_score[0]) & (filtered_df["CreditScore"] <= selected_score[1])
]
filtered_df = filtered_df[
    (filtered_df["Balance"] >= selected_balance[0]) & (filtered_df["Balance"] <= selected_balance[1])
]
if selected_products:
    filtered_df = filtered_df[filtered_df["NumOfProducts"].isin(selected_products)]
if selected_active == "Active Only":
    filtered_df = filtered_df[filtered_df["IsActiveMember"] == 1]
elif selected_active == "Inactive Only":
    filtered_df = filtered_df[filtered_df["IsActiveMember"] == 0]

# Compute metrics on filtered slice
filt_kpis = compute_overview_kpis(filtered_df)
filt_specialized = compute_specialized_kpis(filtered_df, base_churn_rate=base_kpis["churn_rate"])

# ---------------------------------------------------------
# Dashboard Header
# ---------------------------------------------------------
st.markdown("""
<div class="main-header">
    <h1>Customer Segmentation & Churn Pattern Analytics</h1>
    <p>European Retail Banking Intelligence System | France • Germany • Spain Cohort Portfolio</p>
</div>
""", unsafe_allow_html=True)

# ---------------------------------------------------------
# Main Tabs Navigation
# ---------------------------------------------------------
tabs = st.tabs([
    "📊 Executive Overview",
    "🌍 Geography Analysis",
    "👥 Demographic Cohorts",
    "💰 Financial & High-Value",
    "⚡ Engagement & Tenure",
    "🔍 Customer Explorer",
    "🤖 ML Churn Predictor"
])

# Plotly Shared Layout Config
PLOT_TEMPLATE = "plotly_dark"
COLOR_SEQUENCE = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"]

def apply_chart_styling(fig, height=380):
    fig.update_layout(
        template=PLOT_TEMPLATE,
        paper_bgcolor="rgba(19, 29, 54, 0.6)",
        plot_bgcolor="rgba(19, 29, 54, 0.6)",
        font=dict(color="#cbd5e1", family="Inter"),
        height=height,
        margin=dict(l=30, r=30, t=40, b=30),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
    )
    return fig


# =========================================================
# TAB 1: EXECUTIVE OVERVIEW
# =========================================================
with tabs[0]:
    if len(filtered_df) == 0:
        st.warning("⚠️ No customer records match the current filter criteria. Please broaden your selection.")
    else:
        # KPI Row
        kpi_col1, kpi_col2, kpi_col3, kpi_col4, kpi_col5 = st.columns(5)
        
        with kpi_col1:
            st.markdown(f"""
            <div class="kpi-card">
                <div class="kpi-title">Active Portfolio Base</div>
                <div class="kpi-value">{filt_kpis['total_customers']:,}</div>
                <div class="kpi-sub">{(filt_kpis['total_customers']/base_kpis['total_customers']*100):.1f}% of total bank</div>
            </div>
            """, unsafe_allow_html=True)
            
        with kpi_col2:
            st.markdown(f"""
            <div class="kpi-card">
                <div class="kpi-title">Churned Accounts</div>
                <div class="kpi-value kpi-danger">{filt_kpis['churned_customers']:,}</div>
                <div class="kpi-sub">{filt_kpis['retained_customers']:,} retained</div>
            </div>
            """, unsafe_allow_html=True)
            
        with kpi_col3:
            delta = filt_kpis['churn_rate'] - base_kpis['churn_rate']
            delta_str = f"+{delta:.1f}% vs bank" if delta > 0 else f"{delta:.1f}% vs bank"
            st.markdown(f"""
            <div class="kpi-card">
                <div class="kpi-title">Cohort Churn Rate</div>
                <div class="kpi-value {'kpi-danger' if filt_kpis['churn_rate'] > 25 else 'kpi-accent'}">{filt_kpis['churn_rate']}%</div>
                <div class="kpi-sub">{delta_str}</div>
            </div>
            """, unsafe_allow_html=True)
            
        with kpi_col4:
            st.markdown(f"""
            <div class="kpi-card">
                <div class="kpi-title">Retention Rate</div>
                <div class="kpi-value kpi-success">{filt_kpis['retention_rate']}%</div>
                <div class="kpi-sub">Baseline: {base_kpis['retention_rate']}%</div>
            </div>
            """, unsafe_allow_html=True)
            
        with kpi_col5:
            st.markdown(f"""
            <div class="kpi-card">
                <div class="kpi-title">Portfolio Balance</div>
                <div class="kpi-value">${filt_kpis['total_balance']/1e6:.1f}M</div>
                <div class="kpi-sub">Avg: ${filt_kpis['avg_balance']:,.0f}</div>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)

        # Overview Charts Row
        col_c1, col_c2 = st.columns([1, 1.3])
        
        with col_c1:
            st.markdown("##### 📌 Customer Status Breakdown")
            donut_fig = go.Figure(data=[go.Pie(
                labels=["Retained Customers", "Churned Accounts"],
                values=[filt_kpis["retained_customers"], filt_kpis["churned_customers"]],
                hole=0.62,
                marker=dict(colors=["#3b82f6", "#ef4444"]),
                textinfo="label+percent",
                hoverinfo="label+value+percent",
            )])
            donut_fig.update_layout(
                annotations=[dict(text=f"{filt_kpis['churn_rate']}%<br>Churn", x=0.5, y=0.5, font_size=18, font_color="#f87171", showarrow=False)]
            )
            st.plotly_chart(apply_chart_styling(donut_fig, height=330), use_container_width=True)

        with col_c2:
            st.markdown("##### ⚖️ Churn Rate by Core Behavioral Dimensions")
            dim_df = pd.DataFrame([
                {"Dimension": "Geography: Germany", "Churn Rate (%)": 32.44},
                {"Dimension": "Age: 46–60 Years", "Churn Rate (%)": 51.12},
                {"Dimension": "Products: 3+ Products", "Churn Rate (%)": 85.89},
                {"Dimension": "Engagement: Inactive", "Churn Rate (%)": 26.85},
                {"Dimension": "Funded Accounts (>0)", "Churn Rate (%)": 24.08},
                {"Dimension": "Products: 2 Products", "Churn Rate (%)": 7.58},
            ]).sort_values(by="Churn Rate (%)", ascending=True)

            bar_dim = px.bar(
                dim_df,
                x="Churn Rate (%)",
                y="Dimension",
                orientation="h",
                color="Churn Rate (%)",
                color_continuous_scale=["#10b981", "#f59e0b", "#ef4444"],
                text="Churn Rate (%)"
            )
            bar_dim.update_traces(texttemplate="%{text:.1f}%", textposition="outside")
            bar_dim.add_vline(x=20.37, line_dash="dash", line_color="#94a3b8", annotation_text="Bank Baseline (20.4%)")
            st.plotly_chart(apply_chart_styling(bar_dim, height=330), use_container_width=True)

        # Dynamic Data-Driven Insights
        st.markdown("#### 💡 Automated Data-Driven Insights")
        insights = generate_data_driven_insights(filtered_df)
        
        ins_cols = st.columns(len(insights) if len(insights) <= 3 else 3)
        for i, ins in enumerate(insights[:3]):
            with ins_cols[i % 3]:
                sev_class = "high-sev" if ins["severity"] == "high" else ""
                st.markdown(f"""
                <div class="insight-card {sev_class}">
                    <div class="insight-title">{ins['title']}</div>
                    <div class="insight-desc">{ins['description']}</div>
                    <div class="insight-rec">Recommended: {ins['recommendation']}</div>
                </div>
                """, unsafe_allow_html=True)


# =========================================================
# TAB 2: GEOGRAPHY ANALYSIS
# =========================================================
with tabs[1]:
    st.markdown("### 🌍 National Subsidiary Disparity: France, Germany & Spain")
    st.caption("Evaluating Geographic Risk Index (GRI) and localized client behavior.")

    geo_table = filtered_df.groupby("Geography", observed=False).agg(
        Total_Customers=("Exited", "count"),
        Churned_Customers=("Exited", "sum"),
        Churn_Rate=("Exited", lambda x: round(x.mean() * 100, 2)),
        Avg_Balance=("Balance", "mean"),
        Avg_Salary=("EstimatedSalary", "mean"),
        Avg_Age=("Age", "mean")
    ).reset_index()

    # GRI calculation
    base_churn = base_kpis["churn_rate"]
    geo_table["GRI"] = (geo_table["Churn_Rate"] / base_churn * 100).round(1)

    geo_c1, geo_c2 = st.columns([1.2, 1])

    with geo_c1:
        st.markdown("##### 📊 Churn Rate Comparison & Geographic Risk Index")
        geo_fig = px.bar(
            geo_table,
            x="Geography",
            y="Churn_Rate",
            color="Geography",
            color_discrete_map={"Germany": "#ef4444", "France": "#3b82f6", "Spain": "#10b981"},
            text="Churn_Rate",
            labels={"Churn_Rate": "Churn Rate (%)"}
        )
        geo_fig.update_traces(texttemplate="%{text:.2f}%", textposition="outside")
        geo_fig.add_hline(y=base_churn, line_dash="dash", line_color="#cbd5e1", annotation_text=f"Bank Baseline ({base_churn}%)")
        st.plotly_chart(apply_chart_styling(geo_fig, height=360), use_container_width=True)

    with geo_c2:
        st.markdown("##### 🥧 Share of Total Bank Churned Customers")
        geo_pie = px.pie(
            geo_table,
            names="Geography",
            values="Churned_Customers",
            color="Geography",
            color_discrete_map={"Germany": "#ef4444", "France": "#3b82f6", "Spain": "#10b981"},
            hole=0.45
        )
        st.plotly_chart(apply_chart_styling(geo_pie, height=360), use_container_width=True)

    st.markdown("##### 📋 Geographic Performance Summary Table")
    formatted_geo = geo_table.copy()
    formatted_geo["Avg_Balance"] = formatted_geo["Avg_Balance"].map("${:,.2f}".format)
    formatted_geo["Avg_Salary"] = formatted_geo["Avg_Salary"].map("${:,.2f}".format)
    formatted_geo["Avg_Age"] = formatted_geo["Avg_Age"].round(1)
    formatted_geo.rename(columns={
        "Geography": "Country",
        "Total_Customers": "Accounts",
        "Churned_Customers": "Churned",
        "Churn_Rate": "Churn Rate (%)",
        "GRI": "Geographic Risk Index (GRI)"
    }, inplace=True)
    st.dataframe(formatted_geo, use_container_width=True, hide_index=True)


# =========================================================
# TAB 3: DEMOGRAPHIC COHORTS
# =========================================================
with tabs[2]:
    st.markdown("### 👥 Demographic Analysis: Age, Gender & Credit Score")

    demo_c1, demo_c2 = st.columns(2)

    with demo_c1:
        st.markdown("##### 📈 Churn Rate by Age Cohort")
        age_seg = filtered_df.groupby("AgeGroup", observed=False)["Exited"].agg(
            Count="count",
            Churned="sum",
            ChurnRate=lambda x: round(x.mean() * 100, 2)
        ).reset_index()
        
        age_fig = px.bar(
            age_seg,
            x="AgeGroup",
            y="ChurnRate",
            color="ChurnRate",
            color_continuous_scale="Reds",
            text="ChurnRate",
            labels={"AgeGroup": "Age Bracket", "ChurnRate": "Churn Rate (%)"}
        )
        age_fig.update_traces(texttemplate="%{text:.1f}%", textposition="outside")
        st.plotly_chart(apply_chart_styling(age_fig, height=350), use_container_width=True)

    with demo_c2:
        st.markdown("##### 🚻 Gender Disparity & Credit Tier Interaction")
        gender_credit = filtered_df.groupby(["CreditTier", "Gender"], observed=False)["Exited"].agg(
            ChurnRate=lambda x: round(x.mean() * 100, 2)
        ).reset_index()

        gc_fig = px.bar(
            gender_credit,
            x="CreditTier",
            y="ChurnRate",
            color="Gender",
            barmode="group",
            color_discrete_map={"Female": "#ec4899", "Male": "#3b82f6"},
            labels={"CreditTier": "Credit Tier", "ChurnRate": "Churn Rate (%)"}
        )
        st.plotly_chart(apply_chart_styling(gc_fig, height=350), use_container_width=True)

    # 2D Heatmap: Geography vs Age Group
    st.markdown("##### 🔥 Cross-Tabulation Matrix: Churn Rate (%) by Geography and Age Bracket")
    heat_matrix = get_multidimensional_segment_matrix(filtered_df, "Geography", "AgeGroup")
    if not heat_matrix.empty:
        heat_fig = px.imshow(
            heat_matrix,
            labels=dict(x="Age Group", y="Country", color="Churn Rate (%)"),
            text_auto=True,
            color_continuous_scale="YlOrRd"
        )
        st.plotly_chart(apply_chart_styling(heat_fig, height=300), use_container_width=True)


# =========================================================
# TAB 4: FINANCIAL & HIGH-VALUE EXPLORER
# =========================================================
with tabs[3]:
    st.markdown("### 💰 Financial Profile & High-Value Capital Protection")

    fin_c1, fin_c2 = st.columns(2)

    with fin_c1:
        st.markdown("##### 📦 The Product Cross-Selling Curve")
        prod_data = filtered_df.groupby("NumOfProducts", observed=False)["Exited"].agg(
            Count="count",
            ChurnRate=lambda x: round(x.mean() * 100, 2)
        ).reset_index()

        prod_fig = px.line(
            prod_data,
            x="NumOfProducts",
            y="ChurnRate",
            markers=True,
            labels={"NumOfProducts": "Number of Bank Products", "ChurnRate": "Churn Rate (%)"},
            text="ChurnRate"
        )
        prod_fig.update_traces(
            line=dict(color="#f43f5e", width=3),
            marker=dict(size=10, color="#ffffff"),
            texttemplate="%{text:.1f}%",
            textposition="top center"
        )
        st.plotly_chart(apply_chart_styling(prod_fig, height=330), use_container_width=True)

    with fin_c2:
        st.markdown("##### 💵 Balance Tier Breakdown")
        bal_data = filtered_df.groupby("BalanceTier", observed=False)["Exited"].agg(
            Count="count",
            ChurnRate=lambda x: round(x.mean() * 100, 2)
        ).reset_index()

        bal_fig = px.bar(
            bal_data,
            x="BalanceTier",
            y="ChurnRate",
            color="BalanceTier",
            color_discrete_sequence=["#10b981", "#3b82f6", "#ef4444"],
            text="ChurnRate",
            labels={"BalanceTier": "Account Balance Tier", "ChurnRate": "Churn Rate (%)"}
        )
        bal_fig.update_traces(texttemplate="%{text:.1f}%", textposition="outside")
        st.plotly_chart(apply_chart_styling(bal_fig, height=330), use_container_width=True)

    # Interactive High-Value Customer Explorer
    st.markdown("---")
    st.markdown("#### 💎 Interactive High-Value Customer Explorer")
    st.caption("Identify high-capital accounts at severe risk of defection.")

    hv_col1, hv_col2, hv_col3 = st.columns(3)
    with hv_col1:
        hv_min_bal = st.number_input("Minimum Balance Threshold ($)", min_value=50000, max_value=250000, value=100000, step=10000)
    with hv_col2:
        hv_min_score = st.slider("Minimum Credit Score", 500, 850, 650)
    with hv_col3:
        hv_older = st.checkbox("Focus on Senior Accounts (Age >= 45)", value=False)

    hv_mask = (df_full["Balance"] >= hv_min_bal) & (df_full["CreditScore"] >= hv_min_score)
    if hv_older:
        hv_mask = hv_mask & (df_full["Age"] >= 45)
    
    df_hv_slice = df_full[hv_mask]
    hv_total = len(df_hv_slice)
    hv_churned = int(df_hv_slice["Exited"].sum()) if hv_total > 0 else 0
    hv_rate = (hv_churned / hv_total * 100) if hv_total > 0 else 0.0
    hv_lost_bal = df_hv_slice[df_hv_slice["Exited"] == 1]["Balance"].sum() if hv_total > 0 else 0.0

    hv_m1, hv_m2, hv_m3, hv_m4 = st.columns(4)
    hv_m1.metric("Identified High-Value Accounts", f"{hv_total:,}")
    hv_m2.metric("Defected High-Value Accounts", f"{hv_churned:,}")
    hv_m3.metric("Cohort Churn Rate", f"{hv_rate:.1f}%", delta=f"{hv_rate - 20.37:.1f}% vs baseline", delta_color="inverse")
    hv_m4.metric("Total Capital Defected", f"${hv_lost_bal/1e6:.2f}M")


# =========================================================
# TAB 5: ENGAGEMENT & TENURE
# =========================================================
with tabs[4]:
    st.markdown("### ⚡ Customer Engagement & Tenure Dynamics")

    eng_c1, eng_c2 = st.columns(2)

    with eng_c1:
        st.markdown("##### 🚀 Engagement Drop Indicator (Active vs Inactive)")
        act_summary = filtered_df.groupby("EngagementStatus", observed=False)["Exited"].agg(
            Count="count",
            ChurnRate=lambda x: round(x.mean() * 100, 2)
        ).reset_index()

        act_fig = px.bar(
            act_summary,
            x="EngagementStatus",
            y="ChurnRate",
            color="EngagementStatus",
            color_discrete_map={"Active customers": "#10b981", "Inactive customers": "#ef4444"},
            text="ChurnRate",
            labels={"EngagementStatus": "Customer Status", "ChurnRate": "Churn Rate (%)"}
        )
        act_fig.update_traces(texttemplate="%{text:.1f}%", textposition="outside")
        st.plotly_chart(apply_chart_styling(act_fig, height=340), use_container_width=True)

    with eng_c2:
        st.markdown("##### 📅 Churn Rate by Account Tenure (0 – 10 Years)")
        tenure_summary = filtered_df.groupby("Tenure", observed=False)["Exited"].agg(
            ChurnRate=lambda x: round(x.mean() * 100, 2)
        ).reset_index()

        tenure_fig = px.bar(
            tenure_summary,
            x="Tenure",
            y="ChurnRate",
            color_discrete_sequence=["#3b82f6"],
            text="ChurnRate",
            labels={"Tenure": "Tenure with Bank (Years)", "ChurnRate": "Churn Rate (%)"}
        )
        tenure_fig.update_traces(texttemplate="%{text:.1f}%", textposition="outside")
        st.plotly_chart(apply_chart_styling(tenure_fig, height=340), use_container_width=True)


# =========================================================
# TAB 6: CUSTOMER EXPLORER
# =========================================================
with tabs[5]:
    st.markdown("### 🔍 Interactive Customer Explorer & Data Exporter")
    st.caption("Search, filter, and inspect individual account records matching current sidebar parameters.")

    search_query = st.text_input("🔎 Search by Customer ID or Surname:", placeholder="e.g. 15634602 or Hargrave")

    display_df = filtered_df.copy()
    if search_query:
        display_df = display_df[
            display_df["CustomerId"].astype(str).str.contains(search_query, case=False) |
            display_df["Surname"].str.contains(search_query, case=False, na=False)
        ]

    st.write(f"Displaying **{len(display_df):,}** matching customer accounts:")

    columns_to_show = [
        "CustomerId", "Surname", "Geography", "Gender", "Age", "CreditScore",
        "Tenure", "Balance", "NumOfProducts", "HasCrCard", "IsActiveMember",
        "EstimatedSalary", "ChurnStatus"
    ]
    st.dataframe(
        display_df[columns_to_show],
        use_container_width=True,
        hide_index=True
    )

    # Export to CSV
    csv_bytes = display_df[columns_to_show].to_csv(index=False).encode("utf-8")
    st.download_button(
        label="📥 Export Filtered Customer Data to CSV",
        data=csv_bytes,
        file_name="european_bank_filtered_customers.csv",
        mime="text/csv"
    )


# =========================================================
# TAB 7: ML CHURN PREDICTOR & MODEL EVALUATION
# =========================================================
with tabs[6]:
    st.markdown("### 🤖 Supervised Machine Learning & Live Churn Scoring")
    st.caption("Trained on 8,000 customers; tested on 2,000 unseen holdout customers using balanced class weights.")

    ml_col1, ml_col2 = st.columns([1.1, 1])

    with ml_col1:
        st.markdown("#### 🎯 Interactive Individual Churn Predictor")
        st.markdown("Enter client attributes to estimate real-time churn probability and risk tier.")

        with st.form("churn_prediction_form"):
            f_col1, f_col2 = st.columns(2)
            with f_col1:
                input_geo = st.selectbox("Geography", ["France", "Germany", "Spain"])
                input_gender = st.selectbox("Gender", ["Female", "Male"])
                input_age = st.slider("Age", 18, 92, 42)
                input_score = st.slider("Credit Score", 350, 850, 640)
                input_tenure = st.slider("Tenure (Years)", 0, 10, 4)
            with f_col2:
                input_balance = st.number_input("Account Balance ($)", min_value=0.0, max_value=260000.0, value=85000.0, step=1000.0)
                input_products = st.selectbox("Bank Products Held", [1, 2, 3, 4], index=0)
                input_card = st.selectbox("Credit Card Holder", [1, 0], format_func=lambda x: "Yes" if x == 1 else "No")
                input_active = st.selectbox("Active Membership", [1, 0], format_func=lambda x: "Active (1)" if x == 1 else "Inactive (0)")
                input_salary = st.number_input("Estimated Salary ($)", min_value=0.0, max_value=250000.0, value=95000.0, step=1000.0)

            submitted = st.form_submit_button("⚡ Compute Churn Probability", use_container_width=True)

        if submitted:
            cust_dict = {
                "CreditScore": input_score,
                "Geography": input_geo,
                "Gender": input_gender,
                "Age": input_age,
                "Tenure": input_tenure,
                "Balance": input_balance,
                "NumOfProducts": input_products,
                "HasCrCard": input_card,
                "IsActiveMember": input_active,
                "EstimatedSalary": input_salary
            }
            pred_res = predict_churn_single(cust_dict, model_bundle)

            st.markdown(f"""
            <div class="pred-card">
                <div style="font-size: 0.9rem; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Predicted Defection Probability</div>
                <div style="font-size: 2.8rem; font-weight: 800; color: {pred_res['risk_color']}; margin: 0.5rem 0;">
                    {pred_res['churn_probability_pct']}%
                </div>
                <div style="font-size: 1.15rem; font-weight: 600; color: #ffffff;">
                    Risk Tier: <span style="color: {pred_res['risk_color']};">{pred_res['risk_category']} Risk</span>
                </div>
                <p style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.75rem; line-height: 1.4;">
                    {pred_res['disclaimer']}
                </p>
            </div>
            """, unsafe_allow_html=True)

    with ml_col2:
        st.markdown("#### 🏆 Model Performance Comparison")
        st.dataframe(pd.DataFrame(model_bundle["comparison_table"]), hide_index=True, use_container_width=True)

        # Feature Importance Plot
        st.markdown("#### 🔑 Feature Importance Ranking")
        rf_eval = model_bundle["evaluations"]["Random Forest"]
        feat_df = pd.DataFrame(rf_eval["feature_importance"]).sort_values(by="Importance", ascending=True)

        feat_fig = px.bar(
            feat_df,
            x="Importance",
            y="Feature",
            orientation="h",
            color="Importance",
            color_continuous_scale="Viridis"
        )
        st.plotly_chart(apply_chart_styling(feat_fig, height=330), use_container_width=True)

        # Confusion Matrix Display
        st.markdown("#### 🔲 Test Set Confusion Matrix (Holdout N = 2,000)")
        cm_data = rf_eval["confusion_matrix"]
        cm_fig = px.imshow(
            cm_data,
            x=["Retained (Pred)", "Churned (Pred)"],
            y=["Retained (True)", "Churned (True)"],
            color_continuous_scale="Blues",
            text_auto=True
        )
        st.plotly_chart(apply_chart_styling(cm_fig, height=260), use_container_width=True)
