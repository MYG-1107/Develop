/**
 * FinanceFit – Financial Calculator Module
 * Pure functions: no DOM access, fully testable
 */

'use strict';

const FinanceCalc = (() => {

  /**
   * Calculate the total from an array of numbers, ignoring invalid values.
   * @param {number[]} values
   * @returns {number}
   */
  function sum(values) {
    return values.reduce((acc, v) => acc + (isFinite(v) && v > 0 ? v : 0), 0);
  }

  /**
   * Calculate savings rate as a percentage of total income.
   * @param {number} savings
   * @param {number} income
   * @returns {number} 0–100
   */
  function savingsRate(savings, income) {
    if (!income || income <= 0) return 0;
    return Math.min(100, (savings / income) * 100);
  }

  /**
   * Calculate the debt-to-income ratio.
   * @param {number} totalDebtPayments Monthly minimum payments
   * @param {number} income
   * @returns {number} 0–100
   */
  function debtToIncome(totalDebtPayments, income) {
    if (!income || income <= 0) return 0;
    return Math.min(100, (totalDebtPayments / income) * 100);
  }

  /**
   * Calculate the emergency fund ratio.
   * How many months of expenses are covered by current savings.
   * @param {number} currentSavings
   * @param {number} monthlyExpenses
   * @returns {number} months covered (capped at 6 for scoring)
   */
  function emergencyFundMonths(currentSavings, monthlyExpenses) {
    if (!monthlyExpenses || monthlyExpenses <= 0) return 0;
    return currentSavings / monthlyExpenses;
  }

  /**
   * Calculate the Financial Health Score (0–100).
   *
   * Scoring components:
   *   - Savings rate      (40 pts max): ≥20% = full score
   *   - Debt-to-income    (30 pts max): ≤15% = full score
   *   - Emergency fund    (20 pts max): ≥3 months = full score
   *   - Budget balance    (10 pts max): net income > 0 = full score
   *
   * @param {object} data
   * @returns {{ score: number, grade: string, colour: string, breakdown: object }}
   */
  function financialHealthScore(data) {
    const { totalIncome, totalExpenses, monthlySavings, debtPayments, currentSavings, targetEmergencyMonths } = data;

    // ─── Savings rate component (0–40) ───────────────────────────────────
    const sr = savingsRate(monthlySavings, totalIncome);
    // Full score at ≥20%; prorated below
    const savingsScore = Math.min(40, (sr / 20) * 40);

    // ─── Debt-to-income component (0–30) ─────────────────────────────────
    const dti = debtToIncome(debtPayments, totalIncome);
    // Full score at ≤15% DTI; score decreases above 15%
    let debtScore = 0;
    if (dti <= 15) {
      debtScore = 30;
    } else if (dti <= 36) {
      // Linear decrease from 30 → 0 between 15–36%
      debtScore = 30 * (1 - (dti - 15) / 21);
    } else {
      debtScore = 0;
    }

    // ─── Emergency fund component (0–20) ─────────────────────────────────
    const monthlyNeeds = totalExpenses - monthlySavings; // expenses minus savings
    const efMonths = emergencyFundMonths(currentSavings, monthlyNeeds > 0 ? monthlyNeeds : totalExpenses);
    const target = targetEmergencyMonths || 3;
    const efScore = Math.min(20, (efMonths / target) * 20);

    // ─── Budget balance component (0–10) ─────────────────────────────────
    const netIncome = totalIncome - totalExpenses;
    const balanceScore = netIncome >= 0 ? 10 : 0;

    const rawScore = savingsScore + debtScore + efScore + balanceScore;
    const score = Math.round(Math.max(0, Math.min(100, rawScore)));

    // Grade
    let grade, colour;
    if (score >= 80)      { grade = 'Excellent'; colour = 'great'; }
    else if (score >= 65) { grade = 'Good';      colour = 'good'; }
    else if (score >= 45) { grade = 'Fair';      colour = 'fair'; }
    else                  { grade = 'Needs work';colour = 'poor'; }

    return {
      score,
      grade,
      colour,
      breakdown: {
        savingsScore:  Math.round(savingsScore),
        debtScore:     Math.round(debtScore),
        efScore:       Math.round(efScore),
        balanceScore,
        savingsRate:   sr,
        dti,
        efMonths,
        netIncome,
      },
    };
  }

  /**
   * Categorise budget against the 50/30/20 rule.
   * @param {number} needs  Needs spending (housing, food, transport, debt, insurance)
   * @param {number} wants  Wants spending (dining, entertainment, other)
   * @param {number} savings
   * @param {number} income
   * @returns {{ needs: object, wants: object, savings: object }}
   */
  function budgetRule(needs, wants, savings, income) {
    if (!income || income <= 0) return null;

    const neeedsPct   = (needs   / income) * 100;
    const wantsPct    = (wants   / income) * 100;
    const savingsPct  = (savings / income) * 100;

    const status = (actual, target, tolerance = 5) => {
      if (actual <= target + tolerance) return 'ok';
      if (actual <= target + tolerance * 2) return 'warn';
      return 'bad';
    };

    return {
      needs:   { pct: neeedsPct,  target: 50, status: status(neeedsPct,  50) },
      wants:   { pct: wantsPct,   target: 30, status: status(wantsPct,   30) },
      savings: { pct: savingsPct, target: 20, status: savingsPct >= 15 ? 'ok' : savingsPct >= 10 ? 'warn' : 'bad' },
    };
  }

  /**
   * Debt payoff calculator using the standard amortisation formula.
   * @param {number} principal  Total debt
   * @param {number} annualRate Annual interest rate in percent (e.g. 18.9)
   * @param {number} monthlyPayment  Monthly payment amount
   * @returns {{ months: number, totalInterest: number, totalPaid: number } | null}
   */
  function debtPayoff(principal, annualRate, monthlyPayment) {
    if (!principal || principal <= 0) return null;
    if (!monthlyPayment || monthlyPayment <= 0) return null;

    const monthlyRate = annualRate / 100 / 12;

    // If interest-free or 0 rate
    if (monthlyRate <= 0) {
      const months = Math.ceil(principal / monthlyPayment);
      return { months, totalInterest: 0, totalPaid: principal };
    }

    // Minimum payment guard: payment must exceed monthly interest
    const minPayment = principal * monthlyRate;
    if (monthlyPayment <= minPayment) {
      return { months: Infinity, totalInterest: Infinity, totalPaid: Infinity };
    }

    const months = Math.ceil(
      -Math.log(1 - (principal * monthlyRate) / monthlyPayment) / Math.log(1 + monthlyRate)
    );

    const totalPaid = monthlyPayment * months;
    const totalInterest = totalPaid - principal;

    return {
      months: Math.min(months, 600), // cap at 50 years
      totalInterest: Math.max(0, totalInterest),
      totalPaid: Math.max(principal, totalPaid),
    };
  }

  /**
   * Savings goal calculator.
   * How many months to reach a target given current savings and monthly contribution.
   * @param {number} target
   * @param {number} current
   * @param {number} monthly
   * @returns {{ months: number, years: number } | null}
   */
  function savingsGoal(target, current, monthly) {
    if (!target || target <= 0) return null;
    if (!monthly || monthly <= 0) return { months: Infinity, years: Infinity };

    const remaining = Math.max(0, target - current);
    const months = Math.ceil(remaining / monthly);
    return { months, years: +(months / 12).toFixed(1) };
  }

  /**
   * Generate personalised action tips based on financial data.
   * @param {object} data
   * @param {object} scoreData – result from financialHealthScore()
   * @returns {Array<{icon, title, detail}>}
   */
  function generateTips(data, scoreData) {
    const tips = [];
    const { totalIncome, totalExpenses, monthlySavings, debtPayments, currentSavings } = data;
    const { breakdown } = scoreData;

    // Net income
    if (breakdown.netIncome < 0) {
      tips.push({
        icon: '🚨',
        priority: 1,
        title: 'Spending exceeds income',
        detail: `You are spending $${formatCurrency(Math.abs(breakdown.netIncome))} more than you earn each month. Review your largest expense categories and cut at least one non-essential line.`,
      });
    }

    // Savings rate
    if (breakdown.savingsRate < 10) {
      tips.push({
        icon: '💰',
        priority: 2,
        title: 'Increase your savings rate',
        detail: `Your savings rate is ${breakdown.savingsRate.toFixed(1)}%. Aim for at least 10–20%. Try automating a transfer on pay day so it happens before you spend.`,
      });
    } else if (breakdown.savingsRate < 20) {
      tips.push({
        icon: '📈',
        priority: 4,
        title: 'Boost savings toward 20%',
        detail: `Great start at ${breakdown.savingsRate.toFixed(1)}%! Increasing by just 1% per month can make a significant difference over a year.`,
      });
    }

    // Debt-to-income
    if (breakdown.dti > 36) {
      tips.push({
        icon: '💳',
        priority: 2,
        title: 'High debt load — focus on payoff',
        detail: `Your debt payments are ${breakdown.dti.toFixed(1)}% of income (lenders recommend ≤36%). Focus on paying off the highest-interest debt first (avalanche method).`,
      });
    } else if (breakdown.dti > 20) {
      tips.push({
        icon: '🏦',
        priority: 3,
        title: 'Reduce your debt-to-income ratio',
        detail: `At ${breakdown.dti.toFixed(1)}%, your debt payments are manageable but worth reducing. Add any spare funds to your highest-rate balance.`,
      });
    }

    // Emergency fund
    if (breakdown.efMonths < 1) {
      tips.push({
        icon: '🆘',
        priority: 1,
        title: 'Build an emergency fund immediately',
        detail: `You have less than 1 month of expenses saved. Start a dedicated emergency savings account and aim for $1,000 as a first milestone.`,
      });
    } else if (breakdown.efMonths < 3) {
      tips.push({
        icon: '🛡️',
        priority: 2,
        title: 'Build your emergency fund to 3 months',
        detail: `You have ~${breakdown.efMonths.toFixed(1)} months covered. Top it up to 3 months of expenses before directing surplus funds elsewhere.`,
      });
    }

    // Positive reinforcement
    if (breakdown.savingsRate >= 20) {
      tips.push({
        icon: '🎉',
        priority: 5,
        title: 'Excellent savings discipline!',
        detail: 'Saving 20%+ puts you ahead of most households. Consider investing surplus in low-cost index funds or maxing retirement accounts.',
      });
    }

    if (breakdown.dti === 0) {
      tips.push({
        icon: '✅',
        priority: 5,
        title: 'Debt-free — maintain it!',
        detail: 'Being debt-free gives you huge financial flexibility. Keep credit card balances at zero and continue building wealth.',
      });
    }

    // General advice if we have few tips
    if (tips.length < 3) {
      tips.push({
        icon: '📅',
        priority: 5,
        title: 'Review your budget monthly',
        detail: 'Set a 20-minute monthly money date to check your spending, update your goals, and make adjustments early.',
      });
      tips.push({
        icon: '🌱',
        priority: 5,
        title: 'Invest early, invest consistently',
        detail: 'Even $50/month in a low-cost index fund grows to over $50,000 in 20 years (7% avg return). Start as soon as your emergency fund is set.',
      });
    }

    // Sort by priority
    return tips.sort((a, b) => a.priority - b.priority).slice(0, 6);
  }

  /**
   * Format a number as a currency string (USD, no decimals).
   * @param {number} value
   * @returns {string}
   */
  function formatCurrency(value) {
    return Math.round(value).toLocaleString('en-US');
  }

  /**
   * Format months into a human-readable string.
   * @param {number} months
   * @returns {string}
   */
  function formatMonths(months) {
    if (!isFinite(months)) return 'Never (payment too low)';
    if (months <= 0) return 'Already reached!';
    if (months < 12) return `${months} month${months !== 1 ? 's' : ''}`;
    const yrs = Math.floor(months / 12);
    const mo  = months % 12;
    if (mo === 0) return `${yrs} year${yrs !== 1 ? 's' : ''}`;
    return `${yrs} yr ${mo} mo`;
  }

  // Public API
  return {
    sum,
    savingsRate,
    debtToIncome,
    emergencyFundMonths,
    financialHealthScore,
    budgetRule,
    debtPayoff,
    savingsGoal,
    generateTips,
    formatCurrency,
    formatMonths,
  };
})();

// Export for Node.js testing environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FinanceCalc;
}
