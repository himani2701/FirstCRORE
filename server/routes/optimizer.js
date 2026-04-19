const express = require("express");
const router = express.Router();
const { optimizeFDLadder, calcInflationLoss } = require("../utils/fdOptimizer");

// POST /api/optimize
// Body: { corpus, goals, monthlyExpenses, riskAppetite }
router.post("/optimize", (req, res) => {
  try {
    const { corpus, goals, monthlyExpenses, riskAppetite = "balanced" } = req.body;

    if (!corpus || corpus <= 0) {
      return res.status(400).json({ error: "Valid corpus amount required" });
    }
    if (!monthlyExpenses || monthlyExpenses <= 0) {
      return res.status(400).json({ error: "Monthly expenses required" });
    }

    const result = optimizeFDLadder({
      corpus: Number(corpus),
      goals: goals || [],
      monthlyExpenses: Number(monthlyExpenses),
      riskAppetite,
    });

    res.json(result);
  } catch (err) {
    console.error("Optimizer error:", err);
    res.status(500).json({ error: "Optimization failed" });
  }
});

// POST /api/inflation-check
router.post("/inflation-check", (req, res) => {
  try {
    const { monthlySavings } = req.body;
    if (!monthlySavings || monthlySavings <= 0) {
      return res.status(400).json({ error: "Monthly savings amount required" });
    }
    const result = calcInflationLoss(Number(monthlySavings));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Calculation failed" });
  }
});

module.exports = router;
