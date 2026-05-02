import { useState } from "react";
import "./Onboarding.css";

const GOAL_OPTIONS = [
  { id: "bike", label: "Buy a bike / car", emoji: "🏍️", defaultAmount: 150000, defaultMonths: 18 },
  { id: "travel", label: "Travel abroad", emoji: "✈️", defaultAmount: 80000, defaultMonths: 12 },
  { id: "laptop", label: "Upgrade my laptop/gadget", emoji: "💻", defaultAmount: 60000, defaultMonths: 9 },
  { id: "house", label: "Save for house down payment", emoji: "🏠", defaultAmount: 500000, defaultMonths: 36 },
  { id: "wedding", label: "Wedding fund", emoji: "💍", defaultAmount: 300000, defaultMonths: 30 },
  { id: "education", label: "Higher education / upskilling", emoji: "📚", defaultAmount: 200000, defaultMonths: 24 },
];

const STEPS = [
  {
    id: "expenses",
    question: (data) =>
      `Good. Your take-home is ₹${Number(data.salary).toLocaleString("en-IN")}/month.\nWhat are your fixed monthly expenses?`,
    subtext: "Rent, EMI, subscriptions, phone bill — the stuff that goes out no matter what.",
    type: "number",
    field: "expenses",
    placeholder: "e.g. 18000",
    prefix: "₹",
  },
  {
    id: "goals",
    question: () => "What's something you want to save up for in the next 3 years?",
    subtext: "Pick everything that applies. We'll build a plan around your actual life.",
    type: "multiselect",
    field: "selectedGoals",
    options: GOAL_OPTIONS,
  },
  {
    id: "risk",
    question: () => "One last thing — how do you feel about risk?",
    subtext: "No wrong answer. We just want to know your vibe.",
    type: "select",
    field: "riskAppetite",
    options: [
      {
        id: "safe",
        label: "Sleep well safe",
        sublabel: "Only the most trusted banks. Lower returns, zero stress.",
        emoji: "😴",
      },
      {
        id: "balanced",
        label: "Balanced",
        sublabel: "Mix of trusted banks and higher-yield small finance banks. All DICGC insured.",
        emoji: "⚖️",
      },
    ],
  },
];

export default function Onboarding({ initialData, onComplete }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    salary: initialData?.salary || 0,
    expenses: "",
    selectedGoals: [],
    riskAppetite: "",
  });
  const [inputVal, setInputVal] = useState("");
  const [error, setError] = useState("");

  const currentStep = STEPS[step];
  const progress = ((step + 1) / (STEPS.length + 1)) * 100;

  const handleNext = () => {
    setError("");

    if (currentStep.type === "number") {
      const val = parseFloat(inputVal);
      if (!val || val < 0) {
        setError("Please enter a valid amount.");
        return;
      }
      if (val >= data.salary) {
        setError("Your expenses seem higher than your salary. Double-check?");
        return;
      }
      setData((prev) => ({ ...prev, [currentStep.field]: val }));
      setInputVal("");
      setStep((s) => s + 1);
    } else if (currentStep.type === "multiselect") {
      if (data.selectedGoals.length === 0) {
        setError("Pick at least one goal — even if it's a rough idea.");
        return;
      }
      setStep((s) => s + 1);
    } else if (currentStep.type === "select") {
      if (!data.riskAppetite) {
        setError("Please pick one.");
        return;
      }
      // All steps done — compute and submit
      const investable = data.salary - data.expenses;
      const corpus = Math.round(investable * 0.6 * 12); // 60% of monthly surplus x 12 months

      const goals = data.selectedGoals.map((gId) => {
        const opt = GOAL_OPTIONS.find((o) => o.id === gId);
        return {
          name: opt.label,
          emoji: opt.emoji,
          targetAmount: opt.defaultAmount,
          months: opt.defaultMonths,
        };
      });

      onComplete({
        salary: data.salary,
        expenses: data.expenses,
        investable,
        corpus,
        goals,
        riskAppetite: data.riskAppetite,
        monthlyExpenses: data.expenses,
      });
    }
  };

  const toggleGoal = (id) => {
    setData((prev) => ({
      ...prev,
      selectedGoals: prev.selectedGoals.includes(id)
        ? prev.selectedGoals.filter((g) => g !== id)
        : [...prev.selectedGoals, id],
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && currentStep.type === "number") handleNext();
  };

  return (
    <div className="onboarding">
      <div className="onboarding-bg-glow" />

      <div className="onboarding-header container">
        <div className="logo">
          <span className="logo-rupee">₹</span>
          <span>FirstCrore</span>
        </div>
        <div className="progress-bar" style={{ width: "200px" }}>
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <main className="onboarding-main container">
        <div className="chat-window" key={step}>
          {/* Previous messages summary */}
          {step > 0 && data.expenses && (
            <div className="chat-bubble past">
              <span className="text-muted">Monthly expenses:</span>{" "}
              <strong>₹{Number(data.expenses).toLocaleString("en-IN")}</strong>
              <span className="text-muted"> → Investable: </span>
              <strong className="text-green">
                ₹{(data.salary - data.expenses).toLocaleString("en-IN")}/mo
              </strong>
            </div>
          )}
          {step > 1 && data.selectedGoals.length > 0 && (
            <div className="chat-bubble past">
              <span className="text-muted">Your goals: </span>
              {data.selectedGoals.map((gId) => {
                const g = GOAL_OPTIONS.find((o) => o.id === gId);
                return (
                  <span key={gId} className="goal-chip">
                    {g.emoji} {g.label.split(" ").slice(0, 3).join(" ")}
                  </span>
                );
              })}
            </div>
          )}

          {/* Current step */}
          <div className="chat-question animate-fade-up">
            <div className="question-avatar">FC</div>
            <div className="question-content">
              <p className="question-text">
                {currentStep.question(data).split("\n").map((line, i) => (
                  <span key={i}>
                    {line}
                    {i === 0 && <br />}
                  </span>
                ))}
              </p>
              <p className="question-subtext">{currentStep.subtext}</p>
            </div>
          </div>

          {/* Input area */}
          <div className="input-area animate-fade-up" style={{ animationDelay: "0.15s", opacity: 0 }}>
            {currentStep.type === "number" && (
              <div className="number-input-row">
                <div className="salary-input-wrapper">
                  <span className="rupee-prefix">₹</span>
                  <input
                    className="salary-input"
                    type="number"
                    placeholder={currentStep.placeholder}
                    value={inputVal}
                    onChange={(e) => { setInputVal(e.target.value); setError(""); }}
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                  <span className="per-month">/month</span>
                </div>
                <button className="btn btn-primary" onClick={handleNext}>
                  Next →
                </button>
              </div>
            )}

            {currentStep.type === "multiselect" && (
              <div className="multiselect-grid">
                {currentStep.options.map((opt) => (
                  <button
                    key={opt.id}
                    className={`goal-option ${data.selectedGoals.includes(opt.id) ? "selected" : ""}`}
                    onClick={() => toggleGoal(opt.id)}
                  >
                    <span className="goal-emoji">{opt.emoji}</span>
                    <span className="goal-label">{opt.label}</span>
                    {data.selectedGoals.includes(opt.id) && (
                      <span className="goal-check">✓</span>
                    )}
                  </button>
                ))}
                <button
                  className="btn btn-primary next-from-multi"
                  onClick={handleNext}
                  disabled={data.selectedGoals.length === 0}
                >
                  Continue →
                </button>
              </div>
            )}

            {currentStep.type === "select" && (
              <div className="risk-options">
                {currentStep.options.map((opt) => (
                  <button
                    key={opt.id}
                    className={`risk-option ${data.riskAppetite === opt.id ? "selected" : ""}`}
                    onClick={() => { setData((p) => ({ ...p, riskAppetite: opt.id })); setError(""); }}
                  >
                    <span className="risk-emoji">{opt.emoji}</span>
                    <div className="risk-text">
                      <strong>{opt.label}</strong>
                      <span className="risk-sublabel">{opt.sublabel}</span>
                    </div>
                    {data.riskAppetite === opt.id && <span className="risk-check">✓</span>}
                  </button>
                ))}
                <button
                  className="btn btn-primary"
                  onClick={handleNext}
                  disabled={!data.riskAppetite}
                  style={{ marginTop: "0.5rem" }}
                >
                  Build my plan →
                </button>
              </div>
            )}

            {error && <p className="input-error">{error}</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
