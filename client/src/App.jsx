import { useState } from "react";
import "./index.css";
import Landing from "./components/Landing";
import Onboarding from "./components/Onboarding";
import Dashboard from "./components/Dashboard";
import FDLadder from "./components/FDLadder";
import Loading from "./components/Loading";

const SCREENS = {
  LANDING: "landing",
  ONBOARDING: "onboarding",
  LOADING: "loading",
  DASHBOARD: "dashboard",
  LADDER: "ladder",
};

export default function App() {
  const [screen, setScreen] = useState(SCREENS.LANDING);
  const [planData, setPlanData] = useState(null);
  const [ladderData, setLadderData] = useState(null);
  const [initialSalary, setInitialSalary] = useState(null);

  // Landing → Onboarding
  const handleStart = ({ salary }) => {
    setInitialSalary(salary);
    setScreen(SCREENS.ONBOARDING);
  };

  // Onboarding → Loading → Dashboard
  const handleOnboardingComplete = async (data) => {
    setScreen(SCREENS.LOADING);
    setPlanData(data);

    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corpus: data.corpus,
          goals: data.goals,
          monthlyExpenses: data.monthlyExpenses,
          riskAppetite: data.riskAppetite,
        }),
      });
      const ladder = await res.json();
      setLadderData(ladder);
    } catch (err) {
      console.error("Optimizer error:", err);
      // Fallback: generate a basic demo ladder client-side
      setLadderData(generateFallbackLadder(data));
    }

    // Brief pause so loading screen feels intentional
    setTimeout(() => setScreen(SCREENS.DASHBOARD), 2200);
  };

  // Dashboard → Ladder
  const handleContinueToLadder = () => {
    setScreen(SCREENS.LADDER);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Allow going back to start (for demo purposes)
  const handleReset = () => {
    setPlanData(null);
    setLadderData(null);
    setInitialSalary(null);
    setScreen(SCREENS.LANDING);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  return (
    <>
      {screen === SCREENS.LANDING && <Landing onStart={handleStart} />}
      {screen === SCREENS.ONBOARDING && (
        <Onboarding
          initialData={{ salary: initialSalary }}
          onComplete={handleOnboardingComplete}
        />
      )}
      {screen === SCREENS.LOADING && <Loading />}
      {screen === SCREENS.DASHBOARD && planData && ladderData && (
        <Dashboard planData={planData} onContinue={handleContinueToLadder} />
      )}
      {screen === SCREENS.LADDER && planData && ladderData && (
        <>
          <FDLadder planData={planData} ladderData={ladderData} />
          <div style={{ textAlign: "center", padding: "2rem", borderTop: "1px solid var(--border)" }}>
            <button className="btn btn-secondary" onClick={handleReset}>
              ← Start over (demo)
            </button>
          </div>
        </>
      )}
    </>
  );
}

// Client-side fallback if backend is unavailable
function generateFallbackLadder(data) {
  const { corpus, goals, monthlyExpenses, riskAppetite } = data;

  const allocations = [];
  let remaining = corpus;

  // Emergency fund
  const emergency = Math.min(monthlyExpenses * 3, remaining, 150000);
  allocations.push({
    id: "emergency",
    bank: "State Bank of India",
    shortName: "SBI",
    bankType: "public",
    color: "#1B4FBB",
    amount: emergency,
    tenor: 3,
    rate: 5.5,
    maturityAmount: Math.round(emergency * 1.0138),
    maturityDate: getDate(3),
    goal: "Emergency Fund",
    goalEmoji: "🛡️",
    dicgcSafe: true,
  });
  remaining -= emergency;

  goals.slice(0, 3).forEach((g, i) => {
    if (remaining <= 2000) return;
    const amount = Math.min(g.targetAmount, remaining, 200000);
    const rate = riskAppetite === "safe" ? 7.0 : 8.25;
    const bank = riskAppetite === "safe"
      ? { name: "HDFC Bank", shortName: "HDFC", type: "private", color: "#004C8F" }
      : { name: "Suryoday Small Finance Bank", shortName: "Suryoday SFB", type: "sfb", color: "#D97706" };
    allocations.push({
      id: `goal-${i}`,
      bank: bank.name,
      shortName: bank.shortName,
      bankType: bank.type,
      color: bank.color,
      amount,
      tenor: g.months,
      rate,
      maturityAmount: Math.round(amount * (1 + (rate / 100) * (g.months / 12))),
      maturityDate: getDate(g.months),
      goal: g.name,
      goalEmoji: g.emoji,
      dicgcSafe: true,
    });
    remaining -= amount;
  });

  const totalInvested = allocations.reduce((s, a) => s + a.amount, 0);
  const totalReturns = allocations.reduce((s, a) => s + a.maturityAmount, 0);

  return {
    allocations,
    summary: {
      totalInvested,
      totalReturns,
      totalInterest: totalReturns - totalInvested,
      weightedRate: 7.5,
      savingsAccountReturn: Math.round(totalInvested * 0.035),
      extraEarned: Math.round(totalInvested * 0.04),
      numBanks: new Set(allocations.map((a) => a.bank)).size,
    },
    inflationNote: { inflationRate: 6.0, realReturn: 1.5 },
  };
}

function getDate(months) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}
