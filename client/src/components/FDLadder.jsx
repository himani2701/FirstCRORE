import { useState, useEffect } from "react";
import "./FDLadder.css";
import { JargonTerm } from "./JargonBuster";

function formatINR(val) {
  return "₹" + Number(val).toLocaleString("en-IN");
}

function LadderRung({ alloc, index, userContext, delay }) {
  const [visible, setVisible] = useState(false);
  const interest = alloc.maturityAmount - alloc.amount;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const bankTypeLabel =
    alloc.bankType === "sfb"
      ? "Small Finance Bank"
      : alloc.bankType === "public"
      ? "Public Bank"
      : "Private Bank";

  return (
    <div
      className={`rung ${visible ? "rung-visible" : ""}`}
      style={{ "--rung-color": alloc.color }}
    >
      {/* Left: tenor + goal */}
      <div className="rung-left">
        <div className="rung-goal">
          <span className="rung-goal-emoji">{alloc.goalEmoji}</span>
          <span className="rung-goal-name">{alloc.goal}</span>
        </div>
        <div className="rung-tenor">
          <span className="tenor-badge">
            <JargonTerm userContext={userContext}>tenor</JargonTerm>: {alloc.tenor}M
          </span>
          <span className="rung-maturity-date">matures {alloc.maturityDate}</span>
        </div>
      </div>

      {/* Center: bank + bar */}
      <div className="rung-center">
        <div className="rung-bank-row">
          <span className="rung-bank-dot" style={{ background: alloc.color }} />
          <span className="rung-bank-name">{alloc.shortName}</span>
          <span className="rung-bank-type">{bankTypeLabel}</span>
          {alloc.dicgcSafe && (
            <span className="dicgc-badge">
              <JargonTerm userContext={userContext}>DICGC</JargonTerm> ✓
            </span>
          )}
        </div>
        <div className="rung-bar-track">
          <div
            className="rung-bar-fill"
            style={{
              width: visible ? "100%" : "0%",
              background: alloc.color,
              transition: `width 0.8s cubic-bezier(0.4,0,0.2,1) ${delay + 100}ms`,
            }}
          />
        </div>
      </div>

      {/* Right: numbers */}
      <div className="rung-right">
        <div className="rung-amounts">
          <div className="rung-principal">
            <span className="amount-label">Invested</span>
            <span className="amount-value">{formatINR(alloc.amount)}</span>
          </div>
          <div className="rung-arrow">→</div>
          <div className="rung-maturity">
            <span className="amount-label">You get back</span>
            <span className="amount-value text-green">{formatINR(alloc.maturityAmount)}</span>
          </div>
        </div>
        <div className="rung-rate">
          <span className="rate-value">{alloc.rate}% <span className="rate-pa"><JargonTerm userContext={userContext}>p.a.</JargonTerm></span></span>
          <span className="rate-interest">+{formatINR(interest)} interest</span>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ summary, inflationNote, userContext }) {
  return (
    <div className="summary-card">
      <div className="summary-header">
        <span className="summary-title">Your ladder at a glance</span>
        <span className="badge badge-green">All DICGC insured</span>
      </div>

      <div className="summary-grid">
        <div className="summary-stat">
          <span className="summary-stat-label">Total invested</span>
          <span className="summary-stat-value">{formatINR(summary.totalInvested)}</span>
        </div>
        <div className="summary-stat highlight-green">
          <span className="summary-stat-label">Total you get back</span>
          <span className="summary-stat-value text-green">{formatINR(summary.totalReturns)}</span>
        </div>
        <div className="summary-stat highlight-gold">
          <span className="summary-stat-label">Total interest earned</span>
          <span className="summary-stat-value text-gold">{formatINR(summary.totalInterest)}</span>
        </div>
        <div className="summary-stat">
          <span className="summary-stat-label">Banks used</span>
          <span className="summary-stat-value">{summary.numBanks} banks</span>
        </div>
        <div className="summary-stat">
          <span className="summary-stat-label">Weighted avg rate</span>
          <span className="summary-stat-value">{summary.weightedRate}% <JargonTerm userContext={userContext}>p.a.</JargonTerm></span>
        </div>
        <div className="summary-stat highlight-green">
          <span className="summary-stat-label">Extra vs savings a/c</span>
          <span className="summary-stat-value text-green">+{formatINR(summary.extraEarned)}</span>
        </div>
      </div>

      {inflationNote && (
        <div className="inflation-note">
          <span className="inflation-icon">📊</span>
          <span>
            Real return after inflation ({inflationNote.inflationRate}%):{" "}
            <strong className={inflationNote.realReturn > 0 ? "text-green" : "text-red"}>
              {inflationNote.realReturn > 0 ? "+" : ""}{inflationNote.realReturn}%
            </strong>{" "}
            — your money is actually growing, not just keeping up.
          </span>
        </div>
      )}
    </div>
  );
}

function GoalPathCard({ goals, userContext }) {
  const INVESTMENT_PATHS = {
    short: { label: "FD / RD", reason: "Market is too volatile for short goals. FD gives guaranteed returns.", color: "var(--green)" },
    medium: { label: "FD + Debt MF", reason: "Mix of safe FD and slightly higher-yield debt mutual funds.", color: "var(--accent-amber)" },
    long: { label: "Index Fund SIP", reason: "Long runway means you can ride market fluctuations. Equity wins over 5+ years.", color: "var(--blue)" },
  };

  return (
    <div className="goal-path-section">
      <h2 className="section-title">Goal → Investment path</h2>
      <p className="section-sub">The right instrument for each goal depends on your timeline. Here's why we chose what we chose.</p>
      <div className="goal-path-grid">
        {goals.map((g, i) => {
          const path =
            g.months <= 12
              ? INVESTMENT_PATHS.short
              : g.months <= 24
              ? INVESTMENT_PATHS.medium
              : INVESTMENT_PATHS.long;
          const monthlyNeeded = Math.round(g.targetAmount / g.months);
          return (
            <div key={i} className="goal-path-card">
              <div className="goal-path-header">
                <span className="goal-path-emoji">{g.emoji}</span>
                <div className="goal-path-meta">
                  <strong>{g.name}</strong>
                  <span className="text-muted">{g.months} months · {formatINR(g.targetAmount)}</span>
                </div>
              </div>
              <div className="goal-path-instrument" style={{ "--path-color": path.color }}>
                <span className="instrument-label">{path.label}</span>
              </div>
              <p className="goal-path-reason">{path.reason}</p>
              <div className="goal-path-monthly">
                <span className="text-muted">Monthly saving needed:</span>
                <strong className="text-gold">{formatINR(monthlyNeeded)}</strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BookingCTA({ userContext }) {
  const [clicked, setClicked] = useState(false);

  return (
    <div className="booking-section">
      <div className="booking-card">
        <div className="booking-content">
          <h3>Ready to actually do this?</h3>
          <p className="text-muted">
            In a live product, one tap would route your FD booking to the right bank —
            handling KYC, rate lock, and confirmation in seconds.
          </p>
        </div>
        {!clicked ? (
          <button className="btn btn-primary booking-btn" onClick={() => setClicked(true)}>
            Simulate booking (demo) →
          </button>
        ) : (
          <div className="booking-success">
            <span className="success-icon">✅</span>
            <div>
              <strong>Booking simulated!</strong>
              <p className="text-muted" style={{ fontSize: "0.85rem" }}>
                In production: your FD would be routed to the chosen banks, KYC verified,
                and confirmation received within 60 seconds.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FDLadder({ planData, ladderData }) {
  const { goals, salary } = planData;
  const { allocations, summary, inflationNote } = ladderData;
  const userContext = { salary };

  return (
    <div className="fdladder">
      <div className="fdladder-bg" />

      <header className="fdladder-header container">
        <div className="logo">
          <span className="logo-rupee">₹</span>
          <span>FirstCrore</span>
        </div>
        <div className="header-right">
          <span className="badge badge-gold">FD Ladder</span>
        </div>
      </header>

      <main className="fdladder-main container">
        {/* Hero headline */}
        <div className="ladder-hero animate-fade-up">
          <h1 className="ladder-headline">
            Your money,<br />
            <em>working in shifts.</em>
          </h1>
          <p className="ladder-sub text-muted">
            {allocations.length} FDs across {summary.numBanks} banks · all{" "}
            <JargonTerm userContext={userContext}>DICGC</JargonTerm> insured ·
            maturing around your life goals
          </p>
        </div>

        {/* Summary card */}
        <div className="animate-fade-up" style={{ animationDelay: "0.15s", opacity: 0 }}>
          <SummaryCard summary={summary} inflationNote={inflationNote} userContext={userContext} />
        </div>

        {/* The ladder */}
        <div className="ladder-section animate-fade-up" style={{ animationDelay: "0.25s", opacity: 0 }}>
          <h2 className="section-title">The ladder — rung by rung</h2>
          <p className="section-sub text-muted">
            Each rung is a separate FD. Money matures when you need it. Tap any highlighted term to understand it.
          </p>
          <div className="ladder-rungs">
            {allocations.map((alloc, i) => (
              <LadderRung
                key={alloc.id}
                alloc={alloc}
                index={i}
                userContext={userContext}
                delay={i * 120}
              />
            ))}
          </div>
        </div>

        {/* Goal paths */}
        <div className="animate-fade-up" style={{ animationDelay: "0.35s", opacity: 0 }}>
          <GoalPathCard goals={goals} userContext={userContext} />
        </div>

        {/* Blostem CTA */}
        <div className="animate-fade-up" style={{ animationDelay: "0.45s", opacity: 0 }}>
          <BookingCTA userContext={userContext} />
        </div>

        {/* Footer note */}
        <p className="ladder-footer-note text-muted">
          FD rates sourced from publicly available bank rate cards (April 2025). 
          Actual rates may vary. This is a planning tool, not investment advice.
        </p>
      </main>
    </div>
  );
}
