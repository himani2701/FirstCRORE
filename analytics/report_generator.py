"""
FirstCrore — Python Analytics Pipeline
=======================================
Processes user financial data and generates:
  - CSV reports  (reports/user_{id}_report.csv)
  - Bar chart    (reports/user_{id}_trend.png)
  - Donut chart  (reports/user_{id}_spending.png)

Usage:
  pip install pandas matplotlib pymongo
  python report_generator.py --demo        # run with demo data
  python report_generator.py --user <id>   # run for a real user from MongoDB
"""

import argparse
import json
import os
import sys
from datetime import datetime, timedelta
import random

import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

# ── Optional MongoDB connection ──────────────────────────────────────────────
try:
    from pymongo import MongoClient
    MONGO_AVAILABLE = True
except ImportError:
    MONGO_AVAILABLE = False

REPORTS_DIR = os.path.join(os.path.dirname(__file__), "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

CATEGORY_COLORS = {
    "Rent / EMI":    "#6366F1",
    "Food & Dining": "#F59E0B",
    "Transport":     "#10B981",
    "Utilities":     "#06B6D4",
    "Entertainment": "#F43F5E",
    "Shopping":      "#8B5CF6",
    "Healthcare":    "#14B8A6",
    "Savings":       "#84CC16",
}


# ── Data generation ──────────────────────────────────────────────────────────

def build_demo_transactions(income: int = 55000, expenses: int = 32000) -> list[dict]:
    """Generate 6 months of realistic synthetic transactions."""
    categories = [
        ("Rent / EMI",    0.35),
        ("Food & Dining", 0.20),
        ("Transport",     0.08),
        ("Utilities",     0.06),
        ("Entertainment", 0.05),
        ("Shopping",      0.06),
        ("Healthcare",    0.04),
    ]
    records = []
    base = datetime.now().replace(day=1)
    for m in range(6):
        month_date = base - timedelta(days=30 * (5 - m))
        variance   = 0.93 + random.uniform(-0.05, 0.08)
        month_exp  = int(expenses * variance)

        # Income credit
        records.append({
            "userId":   "demo_user",
            "date":     month_date.replace(day=1),
            "type":     "income",
            "category": "Salary",
            "amount":   income,
            "note":     "Monthly salary",
        })

        # Expense debits
        for cat, pct in categories:
            cat_amt = int(income * pct * variance)
            records.append({
                "userId":   "demo_user",
                "date":     month_date.replace(day=random.randint(1, 28)),
                "type":     "expense",
                "category": cat,
                "amount":   cat_amt,
                "note":     f"{cat} — {month_date.strftime('%b %Y')}",
            })

        records.append({
            "userId":   "demo_user",
            "date":     month_date.replace(day=25),
            "type":     "saving",
            "category": "Savings",
            "amount":   income - month_exp,
            "note":     "Monthly net savings",
        })
    return records


def fetch_from_mongo(user_id: str) -> list[dict]:
    if not MONGO_AVAILABLE:
        raise RuntimeError("pymongo not installed — run: pip install pymongo")
    client = MongoClient("mongodb://localhost:27017/")
    db     = client["firstcrore"]
    docs   = list(db.transactions.find({"userId": user_id}))
    client.close()
    return docs


# ── Analysis ──────────────────────────────────────────────────────────────────

def analyse(records: list[dict]) -> dict:
    df = pd.DataFrame(records)
    df["date"] = pd.to_datetime(df["date"])
    df["month"] = df["date"].dt.to_period("M")

    income_df  = df[df["type"] == "income"]
    expense_df = df[df["type"] == "expense"]
    saving_df  = df[df["type"] == "saving"]

    total_income  = income_df["amount"].sum()
    total_expense = expense_df["amount"].sum()
    total_savings = saving_df["amount"].sum()
    savings_rate  = round(total_savings / total_income * 100, 2) if total_income else 0

    category_summary = (
        expense_df.groupby("category")["amount"]
        .agg(total="sum", count="count")
        .sort_values("total", ascending=False)
    )

    monthly_trend = (
        df.groupby(["month", "type"])["amount"]
        .sum()
        .unstack(fill_value=0)
        .reset_index()
    )

    return {
        "total_income":     int(total_income),
        "total_expense":    int(total_expense),
        "total_savings":    int(total_savings),
        "savings_rate":     savings_rate,
        "top_category":     category_summary.index[0] if not category_summary.empty else "N/A",
        "avg_monthly_spend":int(expense_df.groupby("month")["amount"].sum().mean()),
        "category_summary": category_summary,
        "monthly_trend":    monthly_trend,
        "df":               df,
    }


# ── Health Score (mirrors backend rule engine) ────────────────────────────────

def calculate_health_score(savings_rate: float, emergency_months: float, num_goals: int) -> dict:
    score   = 100
    issues  = []

    if savings_rate < 10:
        score -= 30
        issues.append(f"CRITICAL — savings rate {savings_rate:.1f}% (below 10%)")
    elif savings_rate < 20:
        score -= 15
        issues.append(f"WARNING  — savings rate {savings_rate:.1f}% (target: 20%+)")

    if emergency_months < 3:
        score -= 25
        issues.append(f"CRITICAL — emergency fund only {emergency_months:.1f} months (need 3)")

    if num_goals == 0:
        score -= 10
        issues.append("WARNING  — no financial goals defined")

    rating = "Healthy" if score > 80 else "Moderate" if score > 60 else "At Risk"
    return {"score": max(score, 0), "rating": rating, "issues": issues}


# ── Reports ──────────────────────────────────────────────────────────────────

def export_csv(df: pd.DataFrame, user_id: str) -> str:
    path = os.path.join(REPORTS_DIR, f"user_{user_id}_report.csv")
    df.drop(columns=["userId"], errors="ignore").to_csv(path, index=False)
    return path


def plot_monthly_trend(monthly_trend: pd.DataFrame, user_id: str) -> str:
    fig, ax = plt.subplots(figsize=(10, 4))
    months  = monthly_trend["month"].astype(str).tolist()
    x       = range(len(months))

    inc = monthly_trend.get("income",  pd.Series([0]*len(months))).tolist()
    exp = monthly_trend.get("expense", pd.Series([0]*len(months))).tolist()
    sav = monthly_trend.get("saving",  pd.Series([0]*len(months))).tolist()

    ax.bar([i - 0.25 for i in x], inc, width=0.25, label="Income",   color="#6366F1", alpha=0.85)
    ax.bar([i        for i in x], exp, width=0.25, label="Expenses",  color="#F43F5E", alpha=0.85)
    ax.bar([i + 0.25 for i in x], sav, width=0.25, label="Savings",   color="#10B981", alpha=0.85)

    ax.set_xticks(list(x)); ax.set_xticklabels(months, rotation=30, ha="right")
    ax.set_ylabel("Amount (₹)"); ax.set_title("Monthly Income vs Expenses vs Savings", fontweight="bold")
    ax.legend(); ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: f"₹{int(v/1000)}K"))
    ax.spines[["top","right"]].set_visible(False)
    fig.tight_layout()

    path = os.path.join(REPORTS_DIR, f"user_{user_id}_trend.png")
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    return path


def plot_spending_donut(category_summary: pd.DataFrame, user_id: str) -> str:
    fig, ax = plt.subplots(figsize=(7, 5))
    labels  = category_summary.index.tolist()
    sizes   = category_summary["total"].tolist()
    colors  = [CATEGORY_COLORS.get(l, "#9CA3AF") for l in labels]

    wedges, _, autotexts = ax.pie(
        sizes, labels=None, colors=colors,
        autopct="%1.0f%%", pctdistance=0.82,
        wedgeprops=dict(width=0.5, edgecolor="white", linewidth=2),
        startangle=90,
    )
    for at in autotexts:
        at.set_fontsize(8); at.set_color("white"); at.set_fontweight("bold")

    legend = [mpatches.Patch(color=c, label=l) for c, l in zip(colors, labels)]
    ax.legend(handles=legend, loc="center left", bbox_to_anchor=(1, 0.5), fontsize=9, frameon=False)
    ax.set_title("Spending by Category", fontweight="bold", pad=12)

    path = os.path.join(REPORTS_DIR, f"user_{user_id}_spending.png")
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    return path


# ── Main ─────────────────────────────────────────────────────────────────────

def generate_report(user_id: str = "demo", records: list[dict] | None = None) -> dict:
    if records is None:
        records = build_demo_transactions()

    results = analyse(records)
    health  = calculate_health_score(
        savings_rate     = results["savings_rate"],
        emergency_months = results["total_savings"] / max(results["avg_monthly_spend"], 1),
        num_goals        = 2,   # placeholder — wire from DB in production
    )

    csv_path   = export_csv(results["df"], user_id)
    trend_path = plot_monthly_trend(results["monthly_trend"], user_id)
    donut_path = plot_spending_donut(results["category_summary"], user_id)

    summary = {
        "user_id":          user_id,
        "total_income":     f"₹{results['total_income']:,}",
        "total_expenses":   f"₹{results['total_expense']:,}",
        "total_savings":    f"₹{results['total_savings']:,}",
        "savings_rate":     f"{results['savings_rate']}%",
        "top_category":     results["top_category"],
        "avg_monthly_spend":f"₹{results['avg_monthly_spend']:,}",
        "health_score":     health["score"],
        "health_rating":    health["rating"],
        "health_issues":    health["issues"],
        "outputs": {
            "csv":   csv_path,
            "trend": trend_path,
            "donut": donut_path,
        },
    }

    print("\n" + "="*52)
    print("  FirstCrore — Financial Analytics Report")
    print("="*52)
    for k, v in summary.items():
        if k not in ("outputs", "health_issues"):
            print(f"  {k:<22}: {v}")
    if health["issues"]:
        print("\n  Health Issues Detected:")
        for issue in health["issues"]:
            print(f"    • {issue}")
    print("\n  Output files:")
    for label, path in summary["outputs"].items():
        print(f"    [{label}] {path}")
    print("="*52 + "\n")

    return summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="FirstCrore Analytics Pipeline")
    parser.add_argument("--demo",   action="store_true",  help="Run with demo data")
    parser.add_argument("--user",   type=str, default=None, help="MongoDB user ID")
    parser.add_argument("--income", type=int, default=55000)
    parser.add_argument("--expenses", type=int, default=32000)
    args = parser.parse_args()

    if args.user and MONGO_AVAILABLE:
        records = fetch_from_mongo(args.user)
        generate_report(user_id=args.user, records=records)
    else:
        records = build_demo_transactions(income=args.income, expenses=args.expenses)
        generate_report(user_id="demo", records=records)
