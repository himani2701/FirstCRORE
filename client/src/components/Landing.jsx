import { useState, useEffect, useRef } from "react";
import "./Landing.css";

function AnimatedNumber({ value, duration = 1400, prefix = "₹" }) {
  const [displayed, setDisplayed] = useState(0);
  const startTime = useRef(null);
  const rafRef = useRef(null);
  useEffect(() => {
    startTime.current = null;
    const animate = (ts) => {
      if (!startTime.current) startTime.current = ts;
      const p = Math.min((ts - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(value * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);
  return <span>{prefix}{displayed.toLocaleString("en-IN")}</span>;
}

export default function Landing({ onStart }) {
  const [salary, setSalary] = useState("");
  const [showShock, setShowShock] = useState(false);
  const [shockData, setShockData] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateShock = () => {
    const s = parseFloat(salary.replace(/,/g, ""));
    if (!s || s < 5000) return;
    setIsCalculating(true);
    setTimeout(() => {
      const monthlySavable = s * 0.3;
      const yearSaved = monthlySavable * 12;
      const fdReturn = yearSaved * (7.5 / 100);
      const inflationLoss = yearSaved * (6.0 / 100);
      const savingsReturn = yearSaved * (3.5 / 100);
      setShockData({
        salary: s,
        yearSaved: Math.round(yearSaved),
        lostToInflation: Math.round(inflationLoss - savingsReturn),
        extraWithFD: Math.round(fdReturn - savingsReturn),
        savingsReturn: Math.round(savingsReturn),
        fdReturn: Math.round(fdReturn),
      });
      setShowShock(true);
      setIsCalculating(false);
    }, 600);
  };

  return (
    <div className="landing">
      <div className="landing-blob-1" />
      <div className="landing-blob-2" />

      <header className="landing-header container">
        <div className="logo">
          <span className="logo-rupee">₹</span>
          <span>FirstCrore</span>
        </div>
        <span className="badge badge-gold">For India's first earners</span>
      </header>

      <main className="landing-main container">
        <div className="landing-eyebrow animate-fade-up" style={{ animationDelay: "0.05s", opacity: 0 }}>
          🇮🇳 Built for India's first-time earners
        </div>

        <h1 className="landing-headline animate-fade-up" style={{ animationDelay: "0.15s", opacity: 0 }}>
          Your first salary<br />
          <em>deserves a real plan.</em>
        </h1>

        <p className="landing-subtext animate-fade-up" style={{ animationDelay: "0.25s", opacity: 0 }}>
          Nobody teaches you what to do with your first paycheck.
          We do — in plain language, in 4 minutes.
        </p>

        <div className="landing-stats animate-fade-up" style={{ animationDelay: "0.3s", opacity: 0 }}>
          <div className="landing-stat">
            <span className="landing-stat-num">₹5L+</span>
            <span className="landing-stat-label">avg lost to savings a/c</span>
          </div>
          <div className="landing-stat">
            <span className="landing-stat-num">4 min</span>
            <span className="landing-stat-label">to build your FD plan</span>
          </div>
          <div className="landing-stat">
            <span className="landing-stat-num">7.9%</span>
            <span className="landing-stat-label">best FD rate available</span>
          </div>
        </div>

        <div className="shock-input-section">
          <p className="shock-prompt">
            Let's see what your savings account is silently doing to your money →
          </p>
          <div className="salary-input-row">
            <div className="salary-input-wrapper">
              <span className="rupee-prefix">₹</span>
              <input
                className="salary-input"
                type="number"
                placeholder="Your monthly take-home"
                value={salary}
                onChange={(e) => { setSalary(e.target.value); setShowShock(false); }}
                onKeyDown={(e) => e.key === "Enter" && calculateShock()}
                min="0"
              />
              <span className="per-month">/month</span>
            </div>
            <button
              className="btn btn-primary check-btn"
              onClick={calculateShock}
              disabled={!salary || parseFloat(salary) < 5000 || isCalculating}
            >
              {isCalculating ? <span className="btn-spinner" /> : "Show Analysis →"}
            </button>
          </div>
        </div>

        {showShock && shockData && (
          <div className="shock-reveal animate-fade-up">
            <div className="shock-card">
              <div className="shock-icon">😳</div>
              <div>
                <p className="shock-headline">
                  If you park ₹{Math.round(shockData.yearSaved / 1000)}K in a savings account this year,
                  inflation quietly eats{" "}
                  <span className="text-red">
                    <AnimatedNumber value={shockData.lostToInflation} />
                  </span> of it.
                </p>
                <p className="shock-detail text-muted">
                  Savings account gives 3.5%. Inflation runs at 6%. You're losing ground every month you wait.
                </p>
              </div>
              <div className="shock-comparison">
                <div className="comparison-item">
                  <span className="comparison-label">Savings Account</span>
                  <span className="comparison-value red">+₹{shockData.savingsReturn.toLocaleString("en-IN")}</span>
                  <span className="comparison-sublabel">yearly interest</span>
                </div>
                <div className="comparison-arrow">→</div>
                <div className="comparison-item">
                  <span className="comparison-label">Smart FD Ladder</span>
                  <span className="comparison-value green">+₹{shockData.fdReturn.toLocaleString("en-IN")}</span>
                  <span className="comparison-sublabel">yearly interest</span>
                </div>
              </div>
              <div className="shock-extra">
                <span className="text-green">₹{shockData.extraWithFD.toLocaleString("en-IN")} extra</span>
                {" "}— just by knowing where to put it.
              </div>
              <button className="btn btn-primary start-btn" onClick={() => onStart({ salary: shockData.salary })}>
                Build my plan in 4 minutes →
              </button>
            </div>
          </div>
        )}

        {!showShock && (
          <div className="landing-features animate-fade-up" style={{ animationDelay: "0.5s", opacity: 0 }}>
            <div className="feature-pill">🛡️ Emergency Fund First</div>
            <div className="feature-pill">🪜 Smart FD Ladder</div>
            <div className="feature-pill">🎯 Goal-based Investing</div>
            <div className="feature-pill">📊 Analytics Dashboard</div>
            <div className="feature-pill">📚 No Jargon</div>
          </div>
        )}
      </main>

      <footer className="landing-footer container">
        <p className="text-muted" style={{ fontSize: "0.78rem", textAlign: "center" }}>
          All FD data is indicative · For demo purposes only
        </p>
      </footer>
    </div>
  );
}
