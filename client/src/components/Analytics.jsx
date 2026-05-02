import { useState, useEffect, useRef } from "react";
import "./Analytics.css";

// ─── Colour palette ───────────────────────────────────────
const COLORS = ["#6366F1","#F59E0B","#10B981","#F43F5E","#8B5CF6","#06B6D4"];

const CAT_ICONS = {
  "Rent / EMI": "🏠", "Food & Dining": "🍽️", "Transport": "🚗",
  "Utilities": "💡", "Entertainment": "🎬", "Shopping": "🛍️",
  "Healthcare": "💊", "Savings": "🏦",
};

// ─── Generate realistic spending data from planData ─────────
function buildSpendingData(planData) {
  const { salary, expenses } = planData;
  const income = Number(salary);
  const fixedExp = Number(expenses);
  const disposable = income - fixedExp;

  // Category breakdown (% of total expenses incl. savings)
  const raw = [
    { name: "Rent / EMI",     pct: 0.35 },
    { name: "Food & Dining",  pct: 0.20 },
    { name: "Transport",      pct: 0.08 },
    { name: "Utilities",      pct: 0.06 },
    { name: "Entertainment",  pct: 0.05 },
    { name: "Shopping",       pct: 0.06 },
    { name: "Healthcare",     pct: 0.04 },
    { name: "Savings",        pct: 0.16 },
  ];

  const categories = raw.map((c, i) => ({
    ...c,
    amount: Math.round(income * c.pct),
    color: COLORS[i % COLORS.length],
    icon: CAT_ICONS[c.name],
  }));

  // Monthly trend (last 6 months) — slight variance
  const months = ["Dec","Jan","Feb","Mar","Apr","May"];
  const trend = months.map((m, i) => {
    const variance = 0.93 + Math.sin(i * 0.9) * 0.07;
    const exp = Math.round(fixedExp * variance);
    return { month: m, income, expenses: exp, savings: income - exp };
  });

  const avgSavings = Math.round(trend.reduce((s, t) => s + t.savings, 0) / trend.length);
  const savingsRate = Math.round((avgSavings / income) * 100);
  const topCategory = categories.sort((a, b) => b.amount - a.amount)[0];

  return { categories, trend, income, avgSavings, savingsRate, topCategory };
}

// ─── Donut chart (pure SVG) ──────────────────────────────
function DonutChart({ data, size = 160 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.36, strokeW = size * 0.14;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const total = data.reduce((s, d) => s + d.amount, 0);
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 100); return () => clearTimeout(t); }, []);

  const slices = data.map((d) => {
    const pct = d.amount / total;
    const dash = circumference * pct;
    const gap = circumference - dash;
    const slice = { ...d, pct, dash, gap, offset };
    offset += dash;
    return slice;
  });

  return (
    <div className="donut-wrap">
      <div className="donut-svg-wrap" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          {slices.map((s, i) => (
            <circle key={i} cx={cx} cy={cy} r={r}
              fill="none" stroke={s.color} strokeWidth={strokeW}
              strokeDasharray={`${ready ? s.dash : 0} ${circumference}`}
              strokeDashoffset={-s.offset}
              style={{ transition: `stroke-dasharray 0.8s ease ${i * 0.07}s`, transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px` }}
            />
          ))}
        </svg>
        <div className="donut-center-label">
          <span className="dc-val">₹{Math.round(total / 1000)}K</span>
          <span className="dc-sub">/ month</span>
        </div>
      </div>
      <div className="donut-legend">
        {data.slice(0, 6).map((d, i) => (
          <div key={i} className="legend-item">
            <span className="legend-dot" style={{ background: d.color }} />
            <span className="legend-name">{d.name}</span>
            <span className="legend-pct">{Math.round((d.amount / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Bar chart ───────────────────────────────────────────
function HorizontalBars({ data }) {
  const max = Math.max(...data.map((d) => d.amount));
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 200); return () => clearTimeout(t); }, []);

  return (
    <div className="bar-chart">
      {data.map((d, i) => (
        <div key={i} className="bar-row">
          <span className="bar-label">{d.name.split(" ")[0]}</span>
          <div className="bar-track">
            <div className="bar-fill"
              style={{ width: ready ? `${(d.amount / max) * 100}%` : "0%", background: d.color }}
            />
          </div>
          <span className="bar-val">₹{(d.amount / 1000).toFixed(1)}K</span>
        </div>
      ))}
    </div>
  );
}

// ─── Savings trend columns ────────────────────────────────
function TrendBars({ trend }) {
  const maxSav = Math.max(...trend.map((t) => t.savings));
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 300); return () => clearTimeout(t); }, []);

  return (
    <div className="trend-chart">
      <div className="trend-row">
        {trend.map((t, i) => (
          <div key={i} className="trend-bar-wrap">
            <span className="trend-bar-val" style={{ fontSize: "0.65rem", color: t.savings > 0 ? "var(--green)" : "var(--red)" }}>
              {t.savings > 0 ? "+" : ""}₹{Math.round(t.savings / 1000)}K
            </span>
            <div className="trend-bar"
              style={{
                height: ready ? `${Math.max((t.savings / maxSav) * 72, 6)}px` : "4px",
                background: t.savings > 0 ? "var(--chart-3)" : "var(--red)",
                width: "100%",
              }}
            />
            <span className="trend-bar-label">{t.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Analytics component ─────────────────────────────
export default function Analytics({ planData }) {
  const [tab, setTab] = useState("overview");
  const data = buildSpendingData(planData);
  const { categories, trend, income, avgSavings, savingsRate, topCategory } = data;

  const kpis = [
    { icon: "💰", label: "Monthly Income",   value: `₹${(income/1000).toFixed(0)}K`, delta: "+0%", positive: true },
    { icon: "📉", label: "Avg Expenses",     value: `₹${Math.round(trend.reduce((s,t)=>s+t.expenses,0)/trend.length/1000)}K`, delta: "", positive: false },
    { icon: "🏦", label: "Avg Saved/Month",  value: `₹${(avgSavings/1000).toFixed(1)}K`, delta: `${savingsRate}% rate`, positive: true },
    { icon: "🎯", label: "Savings Rate",     value: `${savingsRate}%`, delta: savingsRate >= 20 ? "On track ✓" : "Below target", positive: savingsRate >= 20 },
  ];

  // Rule-based health insights (mirrors the document's scoring engine)
  const insights = [];
  if (savingsRate < 10)       insights.push({ status: "bad",  icon: "🔴", text: <><strong>Critical:</strong> savings rate below 10% — inflation is eating your money faster than you're saving.</> });
  else if (savingsRate < 20)  insights.push({ status: "ok",   icon: "🟡", text: <><strong>Warning:</strong> savings rate is {savingsRate}% — target 20%+ to build real wealth.</> });
  else                        insights.push({ status: "good", icon: "✅", text: <><strong>Great:</strong> {savingsRate}% savings rate puts you in the top 20% of earners your age.</> });

  if (topCategory.pct > 0.35) insights.push({ status: "ok",  icon: "🟡", text: <><strong>{topCategory.name}</strong> takes {Math.round(topCategory.pct*100)}% of income — higher than the 35% guideline.</> });

  const emergencyTarget = planData.expenses * 3;
  if (planData.corpus < emergencyTarget) insights.push({ status: "bad", icon: "🔴", text: <><strong>No emergency fund:</strong> you need ₹{emergencyTarget.toLocaleString("en-IN")} (3 months expenses) before investing.</> });
  else insights.push({ status: "good", icon: "✅", text: <><strong>Emergency fund covered</strong> — you have {Math.round(planData.corpus / planData.expenses)} months of runway.</> });

  if (planData.goals?.length >= 2) insights.push({ status: "good", icon: "✅", text: <><strong>{planData.goals.length} goals set</strong> — goal-based savers are 3× more consistent.</> });

  return (
    <div className="analytics-section">
      <div className="analytics-header-row">
        <div>
          <h2 className="section-title" style={{ marginBottom: 0 }}>Spending Analytics</h2>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            Based on your income profile · simulated for demo
          </p>
        </div>
        <div className="analytics-tab-row">
          {["overview","breakdown","trend"].map((t) => (
            <button key={t} className={`analytics-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="kpi-row">
        {kpis.map((k, i) => (
          <div key={i} className="kpi-card">
            <div className="kpi-icon">{k.icon}</div>
            <span className="kpi-label">{k.label}</span>
            <span className="kpi-value">{k.value}</span>
            {k.delta && <span className={`kpi-delta ${k.positive ? "positive" : "negative"}`}>{k.delta}</span>}
          </div>
        ))}
      </div>

      {tab === "overview" && (
        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-title">Spending by Category</div>
            <div className="chart-subtitle">Where your money goes each month</div>
            <DonutChart data={categories} size={150} />
          </div>
          <div className="chart-card">
            <div className="chart-title">Savings Trend</div>
            <div className="chart-subtitle">Last 6 months · monthly net savings</div>
            <TrendBars trend={trend} />
          </div>
          <div className="chart-card wide">
            <div className="chart-title">Financial Health Insights</div>
            <div className="chart-subtitle">Rule-based scoring — like how banks flag at-risk customers</div>
            <div className="insights-list" style={{ marginTop: "0.5rem" }}>
              {insights.map((ins, i) => (
                <div key={i} className={`insight-item ${ins.status}`}>
                  <span className="insight-icon">{ins.icon}</span>
                  <span className="insight-text">{ins.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "breakdown" && (
        <div className="charts-grid">
          <div className="chart-card wide">
            <div className="chart-title">Category Breakdown</div>
            <div className="chart-subtitle">Monthly amount by spending category</div>
            <HorizontalBars data={categories} />
          </div>
          <div className="chart-card">
            <div className="chart-title">Donut View</div>
            <div className="chart-subtitle">Proportion of each category</div>
            <DonutChart data={categories} size={150} />
          </div>
          <div className="chart-card">
            <div className="chart-title">Income vs Expenses</div>
            <div className="chart-subtitle">Monthly balance at a glance</div>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.85rem", marginTop:"0.5rem" }}>
              {["income","expenses","savings"].map((k,i) => {
                const vals = { income: planData.salary, expenses: planData.expenses, savings: avgSavings };
                const labels = { income:"Monthly Income", expenses:"Fixed Expenses", savings:"Net Savings" };
                const colors = ["var(--chart-1)","var(--chart-4)","var(--chart-3)"];
                const max = planData.salary;
                return (
                  <div key={k} className="bar-row">
                    <span className="bar-label" style={{width:80}}>{labels[k]}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{width:`${(vals[k]/max)*100}%`,background:colors[i]}} />
                    </div>
                    <span className="bar-val">₹{Math.round(vals[k]/1000)}K</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === "trend" && (
        <div className="charts-grid">
          <div className="chart-card wide">
            <div className="chart-title">Monthly Savings Trend</div>
            <div className="chart-subtitle">Net savings per month — last 6 months</div>
            <TrendBars trend={trend} />
          </div>
          <div className="chart-card wide">
            <div className="chart-title">Income vs Expense — Monthly</div>
            <div className="chart-subtitle">Bar comparison across months</div>
            <div className="bar-chart" style={{marginTop:"0.5rem"}}>
              {trend.map((t,i) => (
                <div key={i}>
                  <div className="bar-row">
                    <span className="bar-label">{t.month} Inc</span>
                    <div className="bar-track"><div className="bar-fill" style={{width:`${(t.income/t.income)*100}%`,background:"var(--chart-1)"}} /></div>
                    <span className="bar-val">₹{Math.round(t.income/1000)}K</span>
                  </div>
                  <div className="bar-row">
                    <span className="bar-label">{t.month} Exp</span>
                    <div className="bar-track"><div className="bar-fill" style={{width:`${(t.expenses/t.income)*100}%`,background:"var(--chart-4)"}} /></div>
                    <span className="bar-val">₹{Math.round(t.expenses/1000)}K</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
