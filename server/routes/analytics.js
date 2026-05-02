const express = require("express");
const router = express.Router();

// Financial health score calculator (rule-based engine)
const calculateHealthScore = (userData) => {
  let score = 100;
  const insights = [];

  const savingsRate = (userData.income - userData.expenses) / userData.income * 100;
  if (savingsRate < 10) { score -= 30; insights.push({ type: "critical", message: "Savings below 10% — inflation eating your wealth" }); }
  else if (savingsRate < 20) { score -= 15; insights.push({ type: "warning", message: `Savings at ${Math.round(savingsRate)}% — target 20%+` }); }

  const emergencyMonths = userData.corpus / userData.expenses;
  if (emergencyMonths < 3) { score -= 25; insights.push({ type: "critical", message: "Emergency fund below 3 months" }); }

  if (userData.goals && userData.goals.length === 0) { score -= 10; insights.push({ type: "warning", message: "No financial goals set" }); }

  return {
    score: Math.max(score, 0),
    rating: score > 80 ? "Healthy" : score > 60 ? "Moderate" : "At Risk",
    insights,
  };
};

// Spending category simulation based on income profile
const generateSpendingData = (income, expenses) => {
  const categories = [
    { name: "Rent / EMI",     pct: 0.35 },
    { name: "Food & Dining",  pct: 0.20 },
    { name: "Transport",      pct: 0.08 },
    { name: "Utilities",      pct: 0.06 },
    { name: "Entertainment",  pct: 0.05 },
    { name: "Shopping",       pct: 0.06 },
    { name: "Healthcare",     pct: 0.04 },
    { name: "Savings",        pct: 0.16 },
  ];
  return categories.map((c) => ({
    category: c.name,
    total: Math.round(income * c.pct),
    pct: Math.round(c.pct * 100),
  }));
};

// Monthly trend simulation
const generateMonthlyTrend = (income, expenses) => {
  const months = ["Dec", "Jan", "Feb", "Mar", "Apr", "May"];
  return months.map((month, i) => {
    const variance = 0.93 + Math.sin(i * 0.9) * 0.07;
    const monthExpenses = Math.round(expenses * variance);
    return {
      month,
      income,
      expenses: monthExpenses,
      savings: income - monthExpenses,
    };
  });
};

// GET /api/analytics/spending
router.get("/spending", (req, res) => {
  const { income = 50000, expenses = 30000 } = req.query;
  res.json(generateSpendingData(Number(income), Number(expenses)));
});

// GET /api/analytics/monthly
router.get("/monthly", (req, res) => {
  const { income = 50000, expenses = 30000 } = req.query;
  res.json(generateMonthlyTrend(Number(income), Number(expenses)));
});

// POST /api/analytics/health-score
router.post("/health-score", (req, res) => {
  const { income, expenses, corpus, goals } = req.body;
  if (!income || !expenses) return res.status(400).json({ error: "income and expenses required" });
  res.json(calculateHealthScore({ income, expenses, corpus: corpus || 0, goals: goals || [] }));
});

module.exports = router;
