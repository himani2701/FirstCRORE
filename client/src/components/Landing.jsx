import { useState, useEffect, useRef } from "react";
import "./Landing.css";

const INFLATION_RATE = 6.0;
const SAVINGS_RATE = 3.5;

function AnimatedNumber({ value, duration = 1500, prefix = "₹" }) {
  const [displayed, setDisplayed] = useState(0);
  const startTime = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    startTime.current = null;
    const animate = (timestamp) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(value * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {displayed.toLocaleString("en-IN")}
    </span>
  );
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
      const monthlySavable = s * 0.3; // assume 30% savable
      const yearSaved = monthlySavable * 12;
      const fdReturn = yearSaved * (7.5 / 100);
      const inflationLoss = yearSaved * (INFLATION_RATE / 100);
      const savingsReturn = yearSaved * (SAVINGS_RATE / 100);
      const lostToInflation = Math.round(inflationLoss - savingsReturn);
      const extraWithFD = Math.round(fdReturn - savingsReturn);

      setShockData({
        salary: s,
        yearSaved: Math.round(yearSaved),
        lostToInflation,
        extraWithFD,
        savingsReturn: Math.round(savingsReturn),
        fdReturn: Math.round(fdReturn),
      });
      setShowShock(true);
      setIsCalculating(false);
    }, 600);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") calculateShock();
  };

  return (
    <div className="landing">
      <div className="landing-bg-grid" />
      <div className="landing-bg-glow" />

      <header className="landing-header container">
        <div className="logo">
          <span className="logo-rupee">₹</span>
          <span>FirstCrore</span>
        </div>
        <span className="badge badge-gold">Powered by Blostem</span>
      </header>

      <main className="landing-main container">
        <div className="landing-eyebrow animate-fade-up" style={{ animationDelay: "0.1s", opacity: 0 }}>
          For India's first-time earners
        </div>

        <h1 className="landing-headline animate-fade-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
          Your first salary
          <br />
          <em>deserves a real plan.</em>
        </h1>

        <p className="landing-subtext animate-fade-up" style={{ animationDelay: "0.3s", opacity: 0 }}>
          Nobody teaches you what to do with your first paycheck.
          <br />
          We do. In plain language. In 4 minutes.
        </p>

        <div className="shock-input-section">
          <p className="shock-prompt">
            First , let's see what your savings account is really doing to your money.
          </p>

          <div className="salary-input-row">
            <div className="salary-input-wrapper">
              <span className="rupee-prefix">₹</span>
              <input
                className="salary-input"
                type="number"
                placeholder="Your monthly take-home"
                value={salary}
                onChange={(e) => {
                  setSalary(e.target.value);
                  setShowShock(false);
                }}
                onKeyDown={handleKey}
                min="0"
              />
              <span className="per-month">/month</span>
            </div>
            <button
              className="btn btn-primary check-btn"
              onClick={calculateShock}
              disabled={!salary || parseFloat(salary) < 5000 || isCalculating}
            >
              {isCalculating ? (
                <span className="btn-spinner" />
              ) : (
                "Analyse my savings →"
              )}
            </button>
          </div>
        </div>

        {showShock && shockData && (
          <div className="shock-reveal animate-fade-up">
            <div className="shock-card">
              <div className="shock-icon">😳</div>
              <div className="shock-message">
                <p className="shock-headline">
                  If you park ₹{Math.round(shockData.yearSaved / 1000)}K in a savings
                  account this year, inflation quietly eats{" "}
                  <span className="text-red">
                    <AnimatedNumber value={shockData.lostToInflation} />
                  </span>{" "}
                  of it.
                </p>
                <p className="shock-detail text-muted">
                  Savings account gives 3.5%. Inflation runs at 6%. You're losing ground every month you wait.
                </p>
              </div>

              <div className="shock-comparison">
                <div className="comparison-item red">
                  <span className="comparison-label">Savings Account</span>
                  <span className="comparison-value text-red">
                    +₹{shockData.savingsReturn.toLocaleString("en-IN")}
                  </span>
                  <span className="comparison-sublabel">yearly interest</span>
                </div>
                <div className="comparison-arrow">→</div>
                <div className="comparison-item green">
                  <span className="comparison-label">Smart FD Ladder</span>
                  <span className="comparison-value text-green">
                    +₹{shockData.fdReturn.toLocaleString("en-IN")}
                  </span>
                  <span className="comparison-sublabel">yearly interest</span>
                </div>
              </div>

              <div className="shock-extra">
                <span className="text-green">
                  ₹{shockData.extraWithFD.toLocaleString("en-IN")} extra
                </span>{" "}
                — just by knowing where to put it.
              </div>

              <button
                className="btn btn-primary start-btn"
                onClick={() => onStart({ salary: shockData.salary })}
              >
                Build my plan in 4 minutes →
              </button>
            </div>
          </div>
        )}

        {!showShock && (
          <div className="landing-features animate-fade-up" style={{ animationDelay: "0.6s", opacity: 0 }}>
            <div className="feature-pill">🛡️ Emergency Fund First</div>
            <div className="feature-pill">🪜 Smart FD Ladder</div>
            <div className="feature-pill">🎯 Goal-based Investing</div>
            <div className="feature-pill">📚 No Jargon</div>
          </div>
        )}
      </main>

      <footer className="landing-footer container">
        <p className="text-muted" style={{ fontSize: "0.8rem" }}>
          Built for the Blostem "Hack to the Future" Hackathon 2026 · All FD data is indicative
        </p>
      </footer>
    </div>
  );
}
