const { BANKS, AVAILABLE_TENORS } = require("../data/banks");

const DICGC_LIMIT = 500000; // ₹5 lakh per bank
const INFLATION_RATE = 6.0; // India average CPI

// Find the closest available tenor for a given months target
function findBestTenor(targetMonths) {
  return AVAILABLE_TENORS.reduce((prev, curr) =>
    Math.abs(curr - targetMonths) < Math.abs(prev - targetMonths) ? curr : prev
  );
}

// Get rate for a bank at a specific tenor
function getRateForTenor(bank, tenor) {
  const exactRate = bank.rates[tenor];
  if (exactRate) return exactRate;
  // fallback to closest available
  const closestTenor = findBestTenor(tenor);
  return bank.rates[closestTenor] || 6.0;
}

// Calculate maturity amount (simple compound quarterly)
function calcMaturity(principal, annualRate, months) {
  const quarters = months / 3;
  const quarterlyRate = annualRate / 4 / 100;
  return Math.round(principal * Math.pow(1 + quarterlyRate, quarters));
}

// Get maturity date from today
function getMaturityDate(months) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

// Main optimizer function
function optimizeFDLadder({ corpus, goals, monthlyExpenses, riskAppetite }) {
  const allocations = [];
  let remaining = corpus;
  const bankAllocations = {}; // track per-bank allocation for DICGC limit

  BANKS.forEach((b) => (bankAllocations[b.id] = 0));

  // Step 1: Emergency fund allocation (if needed)
  const emergencyTarget = monthlyExpenses * 3;
  if (remaining >= emergencyTarget) {
    // Find best 3-month rate
    const bestEmergencyBank = [...BANKS]
      .filter((b) => (bankAllocations[b.id] || 0) + emergencyTarget <= DICGC_LIMIT)
      .sort((a, b) => (b.rates[3] || 0) - (a.rates[3] || 0))[0];

    if (bestEmergencyBank) {
      const amount = Math.min(emergencyTarget, DICGC_LIMIT);
      bankAllocations[bestEmergencyBank.id] += amount;
      allocations.push({
        id: `emergency-${bestEmergencyBank.id}`,
        bank: bestEmergencyBank.name,
        shortName: bestEmergencyBank.shortName,
        bankType: bestEmergencyBank.type,
        color: bestEmergencyBank.color,
        amount,
        tenor: 3,
        rate: bestEmergencyBank.rates[3],
        maturityAmount: calcMaturity(amount, bestEmergencyBank.rates[3], 3),
        maturityDate: getMaturityDate(3),
        goal: "Emergency Fund",
        goalEmoji: "🛡️",
        priority: 0,
        dicgcSafe: true,
      });
      remaining -= amount;
    }
  }

  // Step 2: Allocate for each goal
  const sortedGoals = [...goals].sort((a, b) => a.months - b.months);

  sortedGoals.forEach((goal, idx) => {
    if (remaining <= 0) return;

    const tenor = findBestTenor(goal.months);
    const allocationForGoal = Math.min(goal.targetAmount, remaining);

    // Prefer high-rate banks, respecting DICGC limit
    // For conservative: prefer public/large private banks
    // For balanced: allow SFBs (higher rate, still insured)
    let eligibleBanks = [...BANKS]
      .filter((b) => {
        const currentAlloc = bankAllocations[b.id] || 0;
        return currentAlloc + allocationForGoal <= DICGC_LIMIT;
      })
      .sort((a, b) => getRateForTenor(b, tenor) - getRateForTenor(a, tenor));

    if (riskAppetite === "safe") {
      // Prefer public + large private banks first
      const safeBanks = eligibleBanks.filter(
        (b) => b.type === "public" || b.type === "private"
      );
      if (safeBanks.length > 0) eligibleBanks = safeBanks;
    }

    // Try to split across 2 banks if amount > 2L (diversification)
    if (allocationForGoal > 200000 && eligibleBanks.length >= 2) {
      const split1 = Math.round(allocationForGoal * 0.6);
      const split2 = allocationForGoal - split1;
      const bank1 = eligibleBanks[0];
      const bank2 = eligibleBanks.find(
        (b) =>
          b.id !== bank1.id &&
          (bankAllocations[b.id] || 0) + split2 <= DICGC_LIMIT
      );

      if (bank2) {
        [
          { bank: bank1, amount: split1 },
          { bank: bank2, amount: split2 },
        ].forEach(({ bank, amount }, i) => {
          bankAllocations[bank.id] = (bankAllocations[bank.id] || 0) + amount;
          const rate = getRateForTenor(bank, tenor);
          allocations.push({
            id: `goal-${idx}-${i}`,
            bank: bank.name,
            shortName: bank.shortName,
            bankType: bank.type,
            color: bank.color,
            amount,
            tenor,
            rate,
            maturityAmount: calcMaturity(amount, rate, tenor),
            maturityDate: getMaturityDate(tenor),
            goal: goal.name,
            goalEmoji: goal.emoji || "🎯",
            priority: idx + 1,
            dicgcSafe: true,
          });
        });
        remaining -= allocationForGoal;
        return;
      }
    }

    // Single bank allocation
    if (eligibleBanks.length > 0) {
      const bank = eligibleBanks[0];
      const amount = Math.min(
        allocationForGoal,
        DICGC_LIMIT - (bankAllocations[bank.id] || 0)
      );
      bankAllocations[bank.id] = (bankAllocations[bank.id] || 0) + amount;
      const rate = getRateForTenor(bank, tenor);
      allocations.push({
        id: `goal-${idx}`,
        bank: bank.name,
        shortName: bank.shortName,
        bankType: bank.type,
        color: bank.color,
        amount,
        tenor,
        rate,
        maturityAmount: calcMaturity(amount, rate, tenor),
        maturityDate: getMaturityDate(tenor),
        goal: goal.name,
        goalEmoji: goal.emoji || "🎯",
        priority: idx + 1,
        dicgcSafe: true,
      });
      remaining -= amount;
    }
  });

  // Step 3: Any remaining corpus → long-term FD at best 24M rate
  if (remaining > 5000) {
    const bestLongTermBank = [...BANKS]
      .filter((b) => (bankAllocations[b.id] || 0) + remaining <= DICGC_LIMIT)
      .sort((a, b) => (b.rates[24] || 0) - (a.rates[24] || 0))[0];

    if (bestLongTermBank) {
      const amount = Math.min(
        remaining,
        DICGC_LIMIT - (bankAllocations[bestLongTermBank.id] || 0)
      );
      bankAllocations[bestLongTermBank.id] += amount;
      const rate = bestLongTermBank.rates[24];
      allocations.push({
        id: "longterm",
        bank: bestLongTermBank.name,
        shortName: bestLongTermBank.shortName,
        bankType: bestLongTermBank.type,
        color: bestLongTermBank.color,
        amount,
        tenor: 24,
        rate,
        maturityAmount: calcMaturity(amount, rate, 24),
        maturityDate: getMaturityDate(24),
        goal: "Long-term Growth",
        goalEmoji: "🌱",
        priority: 99,
        dicgcSafe: true,
      });
    }
  }

  // Summary stats
  const totalInvested = allocations.reduce((s, a) => s + a.amount, 0);
  const totalReturns = allocations.reduce((s, a) => s + a.maturityAmount, 0);
  const totalInterest = totalReturns - totalInvested;
  const weightedRate =
    allocations.reduce((s, a) => s + a.rate * a.amount, 0) / totalInvested;
  const savingsAccountReturn = totalInvested * 0.035;
  const extraEarned = totalInterest - savingsAccountReturn;

  return {
    allocations: allocations.sort((a, b) => a.tenor - b.tenor),
    summary: {
      totalInvested: Math.round(totalInvested),
      totalReturns: Math.round(totalReturns),
      totalInterest: Math.round(totalInterest),
      weightedRate: Math.round(weightedRate * 100) / 100,
      savingsAccountReturn: Math.round(savingsAccountReturn),
      extraEarned: Math.round(extraEarned),
      numBanks: new Set(allocations.map((a) => a.bank)).size,
    },
    inflationNote: {
      inflationRate: INFLATION_RATE,
      realReturn: Math.round((weightedRate - INFLATION_RATE) * 100) / 100,
    },
  };
}

// Calculate inflation loss for landing page shock
function calcInflationLoss(monthlySavings, months = 12) {
  const totalSaved = monthlySavings * months;
  const savingsReturn = totalSaved * 0.035 * (months / 12);
  const inflationLoss = totalSaved * (INFLATION_RATE / 100) * (months / 12);
  const netLoss = Math.round(inflationLoss - savingsReturn);
  return {
    totalSaved: Math.round(totalSaved),
    savingsReturn: Math.round(savingsReturn),
    inflationLoss: Math.round(inflationLoss),
    netLoss: netLoss > 0 ? netLoss : 0,
  };
}

module.exports = { optimizeFDLadder, calcInflationLoss };
