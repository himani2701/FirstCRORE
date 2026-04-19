import { useState, useEffect } from "react";
import "./Dashboard.css";
import { JargonTerm } from "./JargonBuster";

function ScoreRing({ score, size = 120 }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 300);
    return () => clearTimeout(timer);
  }, [score]);

  const offset = circumference - (animated / 100) * circumference;
  const color =
    score >= 70 ? "var(--green)" : score >= 40 ? "var(--accent-amber)" : "var(--red)";

  return (
    <div className="score-ring-wrapper" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="score-ring-inner">
        <span className="score-number">{score}</span>
        <span className="score-label">/ 100</span>
      </div>
    </div>
  );
}

function calcHealthScore({ salary, expenses, corpus, goals }) {
  let score = 0;
  const details = [];

  // 1. Savings ratio (30 pts)
  const savingsRatio = (salary - expenses) / salary;
  if (savingsRatio >= 0.3) {
    score += 30;
    details.push({ label: "Savings rate", value: `${Math.round(savingsRatio * 100)}%`, status: "good", points: 30 });
  } else if (savingsRatio >= 0.15) {
    score += 18;
    details.push({ label: "Savings rate", value: `${Math.round(savingsRatio * 100)}%`, status: "ok", points: 18, fix: "Try to save 30% — cut one recurring subscription this week." });
  } else {
    score += 8;
    details.push({ label: "Savings rate", value: `${Math.round(savingsRatio * 100)}%`, status: "bad", points: 8, fix: "Your savings rate is below 15%. Track your variable spends for one week — most people find ₹3-5K in invisible leaks." });
  }

  // 2. Emergency fund (25 pts)
  const emergencyTarget = expenses * 3;
  const hasEmergencyFund = corpus >= emergencyTarget;
  if (hasEmergencyFund) {
    score += 25;
    details.push({ label: "Emergency fund", value: "3 months ready", status: "good", points: 25 });
  } else {
    score += 0;
    details.push({ label: "Emergency fund", value: "Not yet", status: "bad", points: 0, fix: `You need ₹${emergencyTarget.toLocaleString("en-IN")} as a safety net. We'll build this into your FD ladder first.` });
  }

  // 3. Investing (25 pts) — are they about to start?
  if (corpus > 0) {
    score += 25;
    details.push({ label: "Investing corpus", value: `₹${corpus.toLocaleString("en-IN")} ready`, status: "good", points: 25 });
  } else {
    details.push({ label: "Investing corpus", value: "Not identified", status: "bad", points: 0, fix: "Once you identify your investable surplus, even ₹5,000/month makes a significant difference over 3 years." });
  }

  // 4. Has goals (20 pts)
  if (goals && goals.length > 0) {
    score += 20;
    details.push({ label: "Goal clarity", value: `${goals.length} goal${goals.length > 1 ? "s" : ""} set`, status: "good", points: 20 });
  } else {
    score += 5;
    details.push({ label: "Goal clarity", value: "No goals defined", status: "bad", points: 5, fix: "Goals turn savings from abstract to concrete. Set at least one — it makes you 3x more likely to actually save." });
  }

  return { score: Math.min(score, 100), details };
}

export default function Dashboard({ planData, onContinue }) {
  const { score, details } = calcHealthScore(planData);
  const { salary, expenses, corpus, goals, investable } = planData;
  const monthlyInvestable = investable || salary - expenses;
  const savingsPercent = Math.round((monthlyInvestable / salary) * 100);

  const gradeLabel =
    score >= 70 ? "Good start! 🎉" : score >= 40 ? "Room to improve 📈" : "Let's fix this 🔧";

  return (
    <div className="dashboard">
      <div className="dashboard-bg-glow" />

      <header className="dashboard-header container">
        <div className="logo">
          <span className="logo-rupee">₹</span>
          <span>FirstCrore</span>
        </div>
        <span className="badge badge-gold">Your Plan</span>
      </header>

      <main className="dashboard-main container">
        {/* Health Score */}
        <section className="health-section animate-fade-up">
          <div className="health-score-card">
            <div className="health-left">
              <ScoreRing score={score} size={130} />
              <div className="health-grade">
                <span className="grade-label">{gradeLabel}</span>
                <span className="grade-sub">Financial Health Score</span>
              </div>
            </div>
            <div className="health-right">
              <p className="health-description">
                Based on your salary, expenses, and goals, here's where you stand financially.
                Your biggest opportunity is right below.
              </p>
              <div className="health-stats">
                <div className="health-stat">
                  <span className="stat-label">Take-home</span>
                  <span className="stat-value">₹{Number(salary).toLocaleString("en-IN")}</span>
                </div>
                <div className="health-stat">
                  <span className="stat-label">Fixed expenses</span>
                  <span className="stat-value">₹{Number(expenses).toLocaleString("en-IN")}</span>
                </div>
                <div className="health-stat highlight">
                  <span className="stat-label">Investable/month</span>
                  <span className="stat-value text-green">
                    ₹{monthlyInvestable.toLocaleString("en-IN")}
                    <span className="stat-percent"> ({savingsPercent}%)</span>
                  </span>
                </div>
                <div className="health-stat">
                  <span className="stat-label">Annual corpus ready</span>
                  <span className="stat-value text-gold">₹{Number(corpus).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Score breakdown */}
        <section className="breakdown-section animate-fade-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
          <h2 className="section-title">What's pulling your score</h2>
          <div className="breakdown-grid">
            {details.map((d, i) => (
              <div key={i} className={`breakdown-card ${d.status}`}>
                <div className="breakdown-top">
                  <span className="breakdown-label">{d.label}</span>
                  <span className={`breakdown-status ${d.status}`}>
                    {d.status === "good" ? "✓" : d.status === "ok" ? "~" : "✗"}
                  </span>
                </div>
                <span className="breakdown-value">{d.value}</span>
                {d.fix && (
                  <p className="breakdown-fix">{d.fix}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Goals preview */}
        <section className="goals-preview animate-fade-up" style={{ animationDelay: "0.3s", opacity: 0 }}>
          <h2 className="section-title">Your goals we'll plan for</h2>
          <div className="goals-chips">
            {goals.map((g, i) => (
              <div key={i} className="goal-preview-chip">
                <span className="goal-chip-emoji">{g.emoji}</span>
                <div className="goal-chip-text">
                  <strong>{g.name}</strong>
                  <span className="text-muted">
                    ₹{g.targetAmount.toLocaleString("en-IN")} · in {g.months} months
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick jargon education */}
        <section className="jargon-intro animate-fade-up" style={{ animationDelay: "0.4s", opacity: 0 }}>
          <p className="jargon-intro-text">
            In your FD plan, you'll see terms like{" "}
            <JargonTerm userContext={{ salary }}>tenor</JargonTerm>,{" "}
            <JargonTerm userContext={{ salary }}>p.a.</JargonTerm>,{" "}
            <JargonTerm userContext={{ salary }}>compounding</JargonTerm>, and{" "}
            <JargonTerm userContext={{ salary }}>DICGC</JargonTerm>.
            Tap any of them — we'll explain in plain language. Always.
          </p>
        </section>

        <button
          className="btn btn-primary build-btn animate-fade-up"
          style={{ animationDelay: "0.5s", opacity: 0 }}
          onClick={onContinue}
        >
          Build my FD ladder →
        </button>
      </main>
    </div>
  );
}
