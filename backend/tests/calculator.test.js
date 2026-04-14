/**
 * FinanceFit – Calculator Unit Tests
 * Uses Node.js built-in test runner (node --test)
 * Run: cd backend && node --test tests/calculator.test.js
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Load the calculator module (path relative to project root)
const FinanceCalc = require('../../js/calculator.js');

/* ── sum ─────────────────────────────────────────────────────────────── */
describe('sum()', () => {
  test('sums positive numbers', () => {
    assert.equal(FinanceCalc.sum([100, 200, 300]), 600);
  });

  test('ignores negative and non-finite values', () => {
    assert.equal(FinanceCalc.sum([-50, 100, NaN, Infinity, 200]), 300);
  });

  test('returns 0 for empty array', () => {
    assert.equal(FinanceCalc.sum([]), 0);
  });
});

/* ── savingsRate ─────────────────────────────────────────────────────── */
describe('savingsRate()', () => {
  test('calculates correct percentage', () => {
    assert.equal(FinanceCalc.savingsRate(500, 2500), 20);
  });

  test('returns 0 when income is 0', () => {
    assert.equal(FinanceCalc.savingsRate(500, 0), 0);
  });

  test('caps at 100%', () => {
    assert.equal(FinanceCalc.savingsRate(3000, 1000), 100);
  });
});

/* ── debtToIncome ────────────────────────────────────────────────────── */
describe('debtToIncome()', () => {
  test('calculates DTI correctly', () => {
    assert.equal(FinanceCalc.debtToIncome(500, 5000), 10);
  });

  test('returns 0 for zero income', () => {
    assert.equal(FinanceCalc.debtToIncome(500, 0), 0);
  });
});

/* ── financialHealthScore ────────────────────────────────────────────── */
describe('financialHealthScore()', () => {
  const baseInput = {
    totalIncome:          5000,
    totalExpenses:        4000,
    monthlySavings:       1000,
    debtPayments:         200,
    currentSavings:       15000,
    targetEmergencyMonths: 3,
  };

  test('returns a score between 0 and 100', () => {
    const result = FinanceCalc.financialHealthScore(baseInput);
    assert.ok(result.score >= 0 && result.score <= 100, `Score ${result.score} out of range`);
  });

  test('returns "Excellent" grade for healthy finances', () => {
    const result = FinanceCalc.financialHealthScore(baseInput);
    assert.equal(result.grade, 'Excellent');
  });

  test('returns "Needs work" for very poor finances', () => {
    const poorInput = {
      totalIncome:          2000,
      totalExpenses:        2500, // spending more than earning
      monthlySavings:       0,
      debtPayments:         1000,
      currentSavings:       0,
      targetEmergencyMonths: 3,
    };
    const result = FinanceCalc.financialHealthScore(poorInput);
    assert.ok(result.score < 45, `Expected score < 45, got ${result.score}`);
  });

  test('score includes breakdown object', () => {
    const result = FinanceCalc.financialHealthScore(baseInput);
    assert.ok('breakdown' in result);
    assert.ok('savingsRate' in result.breakdown);
    assert.ok('dti' in result.breakdown);
    assert.ok('efMonths' in result.breakdown);
    assert.ok('netIncome' in result.breakdown);
  });
});

/* ── budgetRule ──────────────────────────────────────────────────────── */
describe('budgetRule()', () => {
  test('returns correct percentages', () => {
    // income 5000: needs=2500(50%), wants=1500(30%), savings=1000(20%)
    const result = FinanceCalc.budgetRule(2500, 1500, 1000, 5000);
    assert.ok(result !== null);
    assert.equal(result.needs.pct, 50);
    assert.equal(result.wants.pct, 30);
    assert.equal(result.savings.pct, 20);
  });

  test('returns null for zero income', () => {
    const result = FinanceCalc.budgetRule(1000, 500, 200, 0);
    assert.equal(result, null);
  });

  test('marks overspend on needs as bad', () => {
    // 80% on needs is way over 50%
    const result = FinanceCalc.budgetRule(4000, 500, 500, 5000);
    assert.equal(result.needs.status, 'bad');
  });
});

/* ── debtPayoff ──────────────────────────────────────────────────────── */
describe('debtPayoff()', () => {
  test('calculates payoff months correctly', () => {
    // $1000 debt, 0% rate, $100/mo = 10 months
    const result = FinanceCalc.debtPayoff(1000, 0, 100);
    assert.equal(result.months, 10);
    assert.equal(result.totalInterest, 0);
  });

  test('returns null for zero principal', () => {
    const result = FinanceCalc.debtPayoff(0, 18.9, 100);
    assert.equal(result, null);
  });

  test('returns Infinity months when payment too low', () => {
    // $10,000 @ 24% = $200/mo interest; $150 payment < interest
    const result = FinanceCalc.debtPayoff(10000, 24, 150);
    assert.equal(result.months, Infinity);
  });

  test('calculates interest for standard loan', () => {
    // $5000 @ 12% annual, $200/mo
    const result = FinanceCalc.debtPayoff(5000, 12, 200);
    assert.ok(result.months > 0 && isFinite(result.months));
    assert.ok(result.totalInterest > 0);
    assert.ok(result.totalPaid > 5000);
  });
});

/* ── savingsGoal ─────────────────────────────────────────────────────── */
describe('savingsGoal()', () => {
  test('calculates months to reach goal', () => {
    // Need $6000, have $0, save $500/mo = 12 months
    const result = FinanceCalc.savingsGoal(6000, 0, 500);
    assert.equal(result.months, 12);
  });

  test('returns 0 months when already reached', () => {
    const result = FinanceCalc.savingsGoal(5000, 6000, 500);
    assert.equal(result.months, 0);
  });

  test('returns null for zero target', () => {
    const result = FinanceCalc.savingsGoal(0, 1000, 500);
    assert.equal(result, null);
  });

  test('returns Infinity when monthly savings is zero', () => {
    const result = FinanceCalc.savingsGoal(10000, 0, 0);
    assert.equal(result.months, Infinity);
  });
});

/* ── formatCurrency ──────────────────────────────────────────────────── */
describe('formatCurrency()', () => {
  test('formats integer correctly', () => {
    assert.equal(FinanceCalc.formatCurrency(1234), '1,234');
  });

  test('rounds decimals', () => {
    assert.equal(FinanceCalc.formatCurrency(1234.567), '1,235');
  });
});

/* ── formatMonths ────────────────────────────────────────────────────── */
describe('formatMonths()', () => {
  test('returns month string for < 12 months', () => {
    assert.equal(FinanceCalc.formatMonths(3), '3 months');
  });

  test('returns year string for multiples of 12', () => {
    assert.equal(FinanceCalc.formatMonths(24), '2 years');
  });

  test('handles Infinity gracefully', () => {
    assert.ok(FinanceCalc.formatMonths(Infinity).includes('too low') || FinanceCalc.formatMonths(Infinity).includes('Never'));
  });
});

/* ── generateTips ────────────────────────────────────────────────────── */
describe('generateTips()', () => {
  test('returns an array of tips', () => {
    const data = {
      totalIncome: 3000,
      totalExpenses: 3500,
      monthlySavings: 0,
      debtPayments: 500,
      currentSavings: 0,
      targetEmergencyMonths: 3,
    };
    const scoreData = FinanceCalc.financialHealthScore(data);
    const tips = FinanceCalc.generateTips(data, scoreData);
    assert.ok(Array.isArray(tips));
    assert.ok(tips.length >= 1);
  });

  test('each tip has icon, title, detail', () => {
    const data = {
      totalIncome: 5000, totalExpenses: 4000,
      monthlySavings: 500, debtPayments: 0,
      currentSavings: 1000, targetEmergencyMonths: 3,
    };
    const scoreData = FinanceCalc.financialHealthScore(data);
    const tips = FinanceCalc.generateTips(data, scoreData);
    tips.forEach(tip => {
      assert.ok('icon' in tip, 'Missing icon');
      assert.ok('title' in tip, 'Missing title');
      assert.ok('detail' in tip, 'Missing detail');
    });
  });
});
