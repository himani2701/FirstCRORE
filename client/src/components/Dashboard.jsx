import { useState, useEffect } from "react";
import "./Dashboard.css";
import { JargonTerm } from "./JargonBuster";
import Analytics from "./Analytics";

function ScoreRing({ score, size = 120 }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const [animated, setAnimated] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnimated(score), 300); return () => clearTimeout(t); }, [score]);
  const offset = circumference - (animated / 100) * circumference;
  const color = score >= 70 ? "var(--green)" : score >= 40 ? "var(--accent-amber)" : "var(--red)";
  return (
    <div className="score-ring-wrapper" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--border)" strokeWidth="8" />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
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
  let score = 0; const details = [];
  const savingsRatio = (salary - expenses) / salary;
  if (savingsRatio >= 0.3) { score += 30; details.push({ label:"Savings rate", value:`${Math.round(savingsRatio*100)}%`, status:"good", points:30 }); }
  else if (savingsRatio >= 0.15) { score += 18; details.push({ label:"Savings rate", value:`${Math.round(savingsRatio*100)}%`, status:"ok", points:18, fix:"Try to save 30% — cut one recurring subscription." }); }
  else { score += 8; details.push({ label:"Savings rate", value:`${Math.round(savingsRatio*100)}%`, status:"bad", points:8, fix:"Below 15%. Track variable spends for a week — most find ₹3–5K in invisible leaks." }); }

  const emergencyTarget = expenses * 3;
  if (corpus >= emergencyTarget) { score += 25; details.push({ label:"Emergency fund", value:"3 months ready", status:"good", points:25 }); }
  else { details.push({ label:"Emergency fund", value:"Not yet", status:"bad", points:0, fix:`Need ₹${emergencyTarget.toLocaleString("en-IN")} as safety net. We'll build this first in your FD ladder.` }); }

  if (corpus > 0) { score += 25; details.push({ label:"Investing corpus", value:`₹${corpus.toLocaleString("en-IN")} ready`, status:"good", points:25 }); }
  else { details.push({ label:"Investing corpus", value:"Not identified", status:"bad", points:0, fix:"Even ₹5,000/month invested makes a significant difference over 3 years." }); }

  if (goals?.length > 0) { score += 20; details.push({ label:"Goal clarity", value:`${goals.length} goal${goals.length>1?"s":""} set`, status:"good", points:20 }); }
  else { score += 5; details.push({ label:"Goal clarity", value:"No goals defined", status:"bad", points:5, fix:"Goals make you 3× more likely to actually save consistently." }); }

  return { score: Math.min(score, 100), details };
}

export default function Dashboard({ planData, onContinue }) {
  const [activeTab, setActiveTab] = useState("overview");
  const { score, details } = calcHealthScore(planData);
  const { salary, expenses, corpus, goals, investable } = planData;
  const monthlyInvestable = investable || salary - expenses;
  const savingsPercent = Math.round((monthlyInvestable / salary) * 100);
  const gradeLabel = score >= 70 ? "Good start! 🎉" : score >= 40 ? "Room to improve 📈" : "Let's fix this 🔧";

  return (
    <div className="dashboard">
      <header className="dashboard-header container">
        <div className="logo">
          <span className="logo-rupee">₹</span>
          <span>FirstCrore</span>
        </div>
        <nav className="nav-tabs">
          {[["overview","Overview"],["analytics","Analytics"],["plan","FD Plan"]].map(([id,label])=>(
            <button key={id} className={`nav-tab ${activeTab===id?"active":""}`}
              onClick={() => { if(id==="plan") onContinue(); else setActiveTab(id); }}>
              {label}
            </button>
          ))}
        </nav>
        <span className="badge badge-gold">Your Plan</span>
      </header>

      <main className="dashboard-main container">

        {activeTab === "overview" && (
          <>
            {/* Health Score */}
            <section className="animate-fade-up">
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
                    Based on your salary, expenses, and goals. Your biggest opportunity is right below.
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
                      <span className="stat-label">Annual corpus</span>
                      <span className="stat-value text-gold">₹{Number(corpus).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Score breakdown */}
            <section className="animate-fade-up" style={{ animationDelay:"0.15s", opacity:0 }}>
              <h2 className="section-title">What's driving your score</h2>
              <div className="breakdown-grid">
                {details.map((d, i) => (
                  <div key={i} className={`breakdown-card ${d.status}`}>
                    <div className="breakdown-top">
                      <span className="breakdown-label">{d.label}</span>
                      <span className={`breakdown-status ${d.status}`}>
                        {d.status==="good"?"✓":d.status==="ok"?"~":"✗"}
                      </span>
                    </div>
                    <span className="breakdown-value">{d.value}</span>
                    {d.fix && <p className="breakdown-fix">{d.fix}</p>}
                  </div>
                ))}
              </div>
            </section>

            {/* Goals */}
            <section className="animate-fade-up" style={{ animationDelay:"0.25s", opacity:0 }}>
              <h2 className="section-title">Goals we'll plan for</h2>
              <div className="goals-chips">
                {goals.map((g, i) => (
                  <div key={i} className="goal-preview-chip">
                    <span className="goal-chip-emoji">{g.emoji}</span>
                    <div className="goal-chip-text">
                      <strong>{g.name}</strong>
                      <span className="text-muted">₹{g.targetAmount.toLocaleString("en-IN")} · in {g.months} months</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Jargon */}
            <section className="jargon-intro animate-fade-up" style={{ animationDelay:"0.35s", opacity:0 }}>
              <p className="jargon-intro-text">
                In your FD plan you'll see terms like{" "}
                <JargonTerm userContext={{ salary }}>tenor</JargonTerm>,{" "}
                <JargonTerm userContext={{ salary }}>p.a.</JargonTerm>,{" "}
                <JargonTerm userContext={{ salary }}>compounding</JargonTerm>, and{" "}
                <JargonTerm userContext={{ salary }}>DICGC</JargonTerm>.{" "}
                Tap any — we'll explain in plain language. Always.
              </p>
            </section>

            <button className="btn btn-primary build-btn animate-fade-up" style={{ animationDelay:"0.45s", opacity:0 }} onClick={onContinue}>
              Build my FD ladder →
            </button>
          </>
        )}

        {activeTab === "analytics" && (
          <Analytics planData={planData} />
        )}

      </main>
    </div>
  );
}
