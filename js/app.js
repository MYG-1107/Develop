/**
 * FinanceFit – Main Application Script
 * Handles DOM interactions, form state, and rendering results.
 */

'use strict';

/* ── Constants ──────────────────────────────────────────────────────────── */
const STORAGE_KEY = 'financefit_data';
const THEME_KEY   = 'financefit_theme';

/* Budget bar colours */
const BAR_COLOURS = {
  housing:       '#2563EB',
  transport:     '#7C3AED',
  food:          '#10B981',
  debt:          '#EF4444',
  savings:       '#F59E0B',
  entertainment: '#EC4899',
  other:         '#6B7280',
};

/* ── DOM helpers ────────────────────────────────────────────────────────── */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/**
 * Safely read a numeric input value.
 * Returns 0 for empty, negative, or non-numeric inputs.
 */
function getNum(id) {
  const el = $(id);
  if (!el) return 0;
  const val = parseFloat(el.value);
  return isFinite(val) && val >= 0 ? val : 0;
}

/**
 * Create a DOM element with optional classes and inner HTML.
 */
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls)  e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

/* ── Theme ──────────────────────────────────────────────────────────────── */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) {
    applyTheme(saved);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme('dark');
  }
}

/* ── Tab Management ─────────────────────────────────────────────────────── */
function activateTab(tabName) {
  // Update buttons
  $$('.tab-btn').forEach(btn => {
    const isActive = btn.dataset.tab === tabName;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });

  // Update panels
  $$('.tab-panel').forEach(panel => {
    if (panel.id === `tab-${tabName}`) {
      panel.classList.add('active');
      panel.removeAttribute('hidden');
    } else {
      panel.classList.remove('active');
      panel.setAttribute('hidden', '');
    }
  });
}

/* ── Live Income Total ──────────────────────────────────────────────────── */
function updateIncomeTotal() {
  const total = FinanceCalc.sum([
    getNum('#income-salary'),
    getNum('#income-side'),
    getNum('#income-other'),
  ]);
  $('#income-total-display').textContent = `$${FinanceCalc.formatCurrency(total)}`;
}

/* ── Live Expense Total ─────────────────────────────────────────────────── */
function updateExpenseTotal() {
  const total = FinanceCalc.sum([
    getNum('#exp-housing'),
    getNum('#exp-utilities'),
    getNum('#exp-transport'),
    getNum('#exp-fuel'),
    getNum('#exp-groceries'),
    getNum('#exp-dining'),
    getNum('#exp-entertainment'),
    getNum('#exp-debt'),
    getNum('#exp-insurance'),
    getNum('#exp-savings'),
    getNum('#exp-other'),
  ]);
  $('#expense-total-display').textContent = `$${FinanceCalc.formatCurrency(total)}`;
}

/* ── Collect Form Data ──────────────────────────────────────────────────── */
function collectData() {
  return {
    // Income
    incSalary:       getNum('#income-salary'),
    incSide:         getNum('#income-side'),
    incOther:        getNum('#income-other'),

    // Expenses
    expHousing:      getNum('#exp-housing'),
    expUtilities:    getNum('#exp-utilities'),
    expTransport:    getNum('#exp-transport'),
    expFuel:         getNum('#exp-fuel'),
    expGroceries:    getNum('#exp-groceries'),
    expDining:       getNum('#exp-dining'),
    expEntertainment:getNum('#exp-entertainment'),
    expDebt:         getNum('#exp-debt'),
    expInsurance:    getNum('#exp-insurance'),
    expSavings:      getNum('#exp-savings'),
    expOther:        getNum('#exp-other'),

    // Goals
    goalEmergency:        getNum('#goal-emergency'),
    goalCurrentSavings:   getNum('#goal-current-savings'),
    goalTotalDebt:        getNum('#goal-total-debt'),
    goalDebtRate:         getNum('#goal-debt-rate'),
    goalSavingTarget:     getNum('#goal-saving-target'),
  };
}

/* ── Validate ───────────────────────────────────────────────────────────── */
function validate(data) {
  if (data.incSalary <= 0 && data.incSide <= 0 && data.incOther <= 0) {
    return 'Please enter your monthly income on the Income tab.';
  }
  return null;
}

/* ── Persist to localStorage ────────────────────────────────────────────── */
function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // localStorage unavailable (private browsing, quota exceeded)
  }
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/* ── Restore form from saved data ───────────────────────────────────────── */
function restoreForm(data) {
  if (!data) return;
  const map = {
    '#income-salary':          data.incSalary,
    '#income-side':            data.incSide,
    '#income-other':           data.incOther,
    '#exp-housing':            data.expHousing,
    '#exp-utilities':          data.expUtilities,
    '#exp-transport':          data.expTransport,
    '#exp-fuel':               data.expFuel,
    '#exp-groceries':          data.expGroceries,
    '#exp-dining':             data.expDining,
    '#exp-entertainment':      data.expEntertainment,
    '#exp-debt':               data.expDebt,
    '#exp-insurance':          data.expInsurance,
    '#exp-savings':            data.expSavings,
    '#exp-other':              data.expOther,
    '#goal-emergency':         data.goalEmergency,
    '#goal-current-savings':   data.goalCurrentSavings,
    '#goal-total-debt':        data.goalTotalDebt,
    '#goal-debt-rate':         data.goalDebtRate,
    '#goal-saving-target':     data.goalSavingTarget,
  };
  Object.entries(map).forEach(([sel, val]) => {
    const input = $(sel);
    if (input && val > 0) input.value = val;
  });
}

/* ── Render Results ─────────────────────────────────────────────────────── */
function renderResults(data) {
  const totalIncome = FinanceCalc.sum([data.incSalary, data.incSide, data.incOther]);

  // Grouped expenses
  const needs   = FinanceCalc.sum([data.expHousing, data.expUtilities, data.expTransport, data.expFuel, data.expGroceries, data.expDebt, data.expInsurance]);
  const wants   = FinanceCalc.sum([data.expDining, data.expEntertainment, data.expOther]);
  const savings = data.expSavings;
  const totalExpenses = needs + wants + savings;

  const scoreInput = {
    totalIncome,
    totalExpenses,
    monthlySavings:    savings,
    debtPayments:      data.expDebt,
    currentSavings:    data.goalCurrentSavings,
    targetEmergencyMonths: data.goalEmergency || 3,
  };

  const scoreData   = FinanceCalc.financialHealthScore(scoreInput);
  const ruleData    = FinanceCalc.budgetRule(needs, wants, savings, totalIncome);
  const tips        = FinanceCalc.generateTips(scoreInput, scoreData);

  // ─── Show results panel ──────────────────────────────────────────────
  $('#results-empty').setAttribute('hidden', '');
  const content = $('#results-content');
  content.removeAttribute('hidden');

  // ─── Score Ring ──────────────────────────────────────────────────────
  const ring      = $('#score-ring');
  const ringFill  = $('#ring-fill');
  const circumference = 326.7; // 2π × 52

  ring.className = `score-ring score--${scoreData.colour}`;
  $('#score-number').textContent = scoreData.score;
  $('#score-label').textContent  = scoreData.grade;
  $('#score-title').textContent  = 'Financial Health Score';

  const descriptions = {
    great: 'Outstanding! Your finances are in excellent shape. Stay the course and look to optimise and grow wealth.',
    good:  'Good financial health! A few tweaks will push you to excellent. Focus on the action plan below.',
    fair:  'Your finances need some attention. Follow the action plan and you\'ll see improvement quickly.',
    poor:  'Your finances need urgent attention. Prioritise the critical actions below immediately.',
  };
  $('#score-description').textContent = descriptions[scoreData.colour];

  // Animate ring
  const offset = circumference - (scoreData.score / 100) * circumference;
  // Use requestAnimationFrame to trigger CSS transition
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ringFill.style.strokeDashoffset = offset;
    });
  });

  // ─── Budget Bars ──────────────────────────────────────────────────────
  const barsEl = $('#budget-bars');
  barsEl.innerHTML = '';

  const barItems = [
    { name: 'Housing & Utilities', amount: data.expHousing + data.expUtilities, colour: BAR_COLOURS.housing },
    { name: 'Transport',           amount: data.expTransport + data.expFuel,     colour: BAR_COLOURS.transport },
    { name: 'Food & Lifestyle',    amount: data.expGroceries + data.expDining,   colour: BAR_COLOURS.food },
    { name: 'Debt Payments',       amount: data.expDebt + data.expInsurance,     colour: BAR_COLOURS.debt },
    { name: 'Savings',             amount: savings,                               colour: BAR_COLOURS.savings },
    { name: 'Entertainment & Other', amount: data.expEntertainment + data.expOther, colour: BAR_COLOURS.entertainment },
  ].filter(b => b.amount > 0);

  barItems.forEach(b => {
    const pct = totalIncome > 0 ? Math.min(100, (b.amount / totalIncome) * 100) : 0;
    const item = el('div', 'budget-bar-item');
    item.innerHTML = `
      <div class="budget-bar-header">
        <span class="budget-bar-name">${b.name}</span>
        <span class="budget-bar-amount">$${FinanceCalc.formatCurrency(b.amount)} (${pct.toFixed(0)}%)</span>
      </div>
      <div class="budget-bar-track" role="progressbar" aria-valuenow="${pct.toFixed(0)}" aria-valuemin="0" aria-valuemax="100" aria-label="${b.name}">
        <div class="budget-bar-fill" style="width:0%;background:${b.colour}" data-width="${pct}"></div>
      </div>`;
    barsEl.appendChild(item);
  });

  // Animate bars
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      $$('.budget-bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.width + '%';
      });
    });
  });

  // Net remaining
  const net = totalIncome - totalExpenses;
  const netItem = el('div', 'budget-bar-item');
  netItem.style.borderTop = '1px solid var(--clr-border)';
  netItem.style.paddingTop = 'var(--space-3)';
  netItem.style.marginTop  = 'var(--space-2)';
  netItem.innerHTML = `
    <div class="budget-bar-header">
      <span class="budget-bar-name" style="font-weight:600">Net income remaining</span>
      <span class="budget-bar-amount" style="font-weight:700;color:${net >= 0 ? 'var(--clr-success)' : 'var(--clr-danger)'}">
        ${net >= 0 ? '+' : '-'}$${FinanceCalc.formatCurrency(Math.abs(net))}
      </span>
    </div>`;
  barsEl.appendChild(netItem);

  // ─── 50/30/20 Rule ───────────────────────────────────────────────────
  const ruleEl = $('#rule-analysis');
  ruleEl.innerHTML = '';

  if (ruleData && totalIncome > 0) {
    const rows = [
      { label: 'Needs',   data: ruleData.needs,   desc: 'housing, food, transport, debt' },
      { label: 'Wants',   data: ruleData.wants,   desc: 'dining, entertainment, other' },
      { label: 'Savings', data: ruleData.savings,  desc: 'savings, investments' },
    ];
    rows.forEach(r => {
      const row = el('div', 'rule-row');
      row.innerHTML = `
        <div class="rule-indicator rule-indicator--${r.data.status}" aria-hidden="true"></div>
        <span class="rule-label">${r.label}</span>
        <span class="rule-actual" style="color:var(--clr-score-${r.data.status === 'ok' ? 'good' : r.data.status === 'warn' ? 'fair' : 'poor'})">${r.data.pct.toFixed(0)}%</span>
        <span class="rule-target">target: ${r.data.target}%</span>`;
      ruleEl.appendChild(row);
    });
  } else {
    ruleEl.innerHTML = '<p style="color:var(--clr-text-muted);font-size:var(--font-size-sm)">Enter income and expenses to see this analysis.</p>';
  }

  // ─── Key Metrics ─────────────────────────────────────────────────────
  const metricsEl = $('#metrics-list');
  metricsEl.innerHTML = '';
  const metrics = [
    { label: 'Monthly income',  value: `$${FinanceCalc.formatCurrency(totalIncome)}` },
    { label: 'Monthly expenses',value: `$${FinanceCalc.formatCurrency(totalExpenses)}` },
    { label: 'Savings rate',    value: `${scoreData.breakdown.savingsRate.toFixed(1)}%` },
    { label: 'Debt-to-income',  value: `${scoreData.breakdown.dti.toFixed(1)}%` },
    { label: 'Emergency fund',  value: `${scoreData.breakdown.efMonths.toFixed(1)} mo` },
    { label: 'Net monthly',     value: `$${FinanceCalc.formatCurrency(net)}` },
  ];
  metrics.forEach(m => {
    const dt = el('dt', null, m.label);
    const dd = el('dd', null, m.value);
    metricsEl.appendChild(dt);
    metricsEl.appendChild(dd);
  });

  // ─── Goals ───────────────────────────────────────────────────────────
  const goalsEl  = $('#goals-results');
  const goalsCard = $('#goals-card');
  goalsEl.innerHTML = '';
  let hasGoals = false;

  // Emergency fund goal
  if (data.goalEmergency > 0 && totalExpenses > 0) {
    hasGoals = true;
    const monthlyNeeds = totalExpenses - savings;
    const efTarget = (data.goalEmergency) * (monthlyNeeds > 0 ? monthlyNeeds : totalExpenses);
    const efCurrent = data.goalCurrentSavings;
    const efPct = efTarget > 0 ? Math.min(100, (efCurrent / efTarget) * 100) : 0;
    const efRemaining = Math.max(0, efTarget - efCurrent);
    const efMonths = savings > 0 ? Math.ceil(efRemaining / savings) : null;

    const goalEl = el('div', 'goal-item');
    goalEl.innerHTML = `
      <div class="goal-header">
        <span>🛡️ Emergency Fund (${data.goalEmergency} months)</span>
        <span style="color:var(--clr-primary)">$${FinanceCalc.formatCurrency(efCurrent)} / $${FinanceCalc.formatCurrency(efTarget)}</span>
      </div>
      <div class="goal-progress-track" role="progressbar" aria-valuenow="${efPct.toFixed(0)}" aria-valuemin="0" aria-valuemax="100">
        <div class="goal-progress-fill" style="width:${efPct}%;background:var(--clr-secondary)"></div>
      </div>
      <p class="goal-note">${efPct >= 100 ? '✅ Goal reached!' : `${efPct.toFixed(0)}% funded${efMonths ? ` · ~${FinanceCalc.formatMonths(efMonths)} to reach goal at current savings rate` : ''}`}</p>`;
    goalsEl.appendChild(goalEl);
  }

  // Debt payoff goal
  if (data.goalTotalDebt > 0 && data.expDebt > 0) {
    hasGoals = true;
    const payoff = FinanceCalc.debtPayoff(data.goalTotalDebt, data.goalDebtRate || 18.9, data.expDebt);
    const goalEl = el('div', 'goal-item');
    if (payoff) {
      goalEl.innerHTML = `
        <div class="goal-header">
          <span>💳 Debt Payoff ($${FinanceCalc.formatCurrency(data.goalTotalDebt)} @ ${data.goalDebtRate || 18.9}%)</span>
        </div>
        <p class="goal-note" style="font-size:var(--font-size-sm)">
          At $${FinanceCalc.formatCurrency(data.expDebt)}/mo: paid off in <strong>${FinanceCalc.formatMonths(payoff.months)}</strong> — total interest: <strong>$${FinanceCalc.formatCurrency(payoff.totalInterest)}</strong>
        </p>`;
    }
    goalsEl.appendChild(goalEl);
  }

  // Savings goal
  if (data.goalSavingTarget > 0) {
    hasGoals = true;
    const goalCalc = FinanceCalc.savingsGoal(data.goalSavingTarget, data.goalCurrentSavings, savings);
    const pct = data.goalSavingTarget > 0 ? Math.min(100, (data.goalCurrentSavings / data.goalSavingTarget) * 100) : 0;
    const goalEl = el('div', 'goal-item');
    goalEl.innerHTML = `
      <div class="goal-header">
        <span>🎯 Savings Goal ($${FinanceCalc.formatCurrency(data.goalSavingTarget)})</span>
        <span style="color:var(--clr-primary)">$${FinanceCalc.formatCurrency(data.goalCurrentSavings)} saved</span>
      </div>
      <div class="goal-progress-track" role="progressbar" aria-valuenow="${pct.toFixed(0)}" aria-valuemin="0" aria-valuemax="100">
        <div class="goal-progress-fill" style="width:${pct}%"></div>
      </div>
      <p class="goal-note">${pct >= 100 ? '✅ Goal reached!' : `${pct.toFixed(0)}% reached · ${goalCalc ? FinanceCalc.formatMonths(goalCalc.months) + ' to go at current savings rate' : 'add monthly savings to see projection'}`}</p>`;
    goalsEl.appendChild(goalEl);
  }

  if (!hasGoals) {
    goalsEl.innerHTML = '<p style="color:var(--clr-text-muted);font-size:var(--font-size-sm)">Fill in the Goals tab to see personalised goal tracking.</p>';
  }

  // ─── Action Plan ──────────────────────────────────────────────────────
  const actionEl = $('#action-list');
  actionEl.innerHTML = '';
  tips.forEach(tip => {
    const li = el('li', 'action-item');
    li.innerHTML = `
      <span class="action-icon" aria-hidden="true">${tip.icon}</span>
      <div class="action-text">
        <strong>${tip.title}</strong>
        <p>${tip.detail}</p>
      </div>`;
    actionEl.appendChild(li);
  });

  // Scroll to results on mobile
  if (window.innerWidth <= 1024) {
    document.getElementById('results-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* ── Reset ──────────────────────────────────────────────────────────────── */
function resetAll() {
  // Clear all inputs
  $$('input[type="number"]').forEach(input => { input.value = ''; });

  // Hide results
  $('#results-empty').removeAttribute('hidden');
  $('#results-content').setAttribute('hidden', '');

  // Reset ring
  const ringFill = $('#ring-fill');
  if (ringFill) ringFill.style.strokeDashoffset = '326.7';

  // Reset totals
  $('#income-total-display').textContent = '$0';
  $('#expense-total-display').textContent = '$0';

  // Go back to income tab
  activateTab('income');

  // Clear storage
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }

  showToast('Form cleared. Start fresh!');
}

/* ── Share ──────────────────────────────────────────────────────────────── */
function shareScore() {
  const score = $('#score-number').textContent;
  const grade = $('#score-label').textContent;
  const text  = `My FinanceFit score is ${score}/100 (${grade})! Check yours at ${window.location.href}`;

  if (navigator.share) {
    navigator.share({ title: 'My FinanceFit Score', text, url: window.location.href })
      .catch(() => copyToClipboard(text));
  } else {
    copyToClipboard(text);
  }
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => showToast('Copied to clipboard! Share with a friend. 📋'))
      .catch(() => showToast('Could not copy. Try manually copying the URL.'));
  } else {
    showToast('Share this URL: ' + window.location.href);
  }
}

/* ── Toast Notification ──────────────────────────────────────────────────── */
function showToast(message, duration = 3000) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.removeAttribute('hidden');
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.setAttribute('hidden', ''), 300);
  }, duration);
}

/* ── Calculation trigger ─────────────────────────────────────────────────── */
function handleCalculate() {
  const calcBtn = $('#calculate-btn');
  const btnText = calcBtn.querySelector('.btn-text');
  const btnLoading = calcBtn.querySelector('.btn-loading');

  // Show loading state
  btnText.setAttribute('hidden', '');
  btnLoading.removeAttribute('hidden');
  calcBtn.setAttribute('disabled', '');

  // Use setTimeout to allow repaint before heavy calculation
  setTimeout(() => {
    const data = collectData();
    const error = validate(data);

    if (error) {
      showToast('⚠️ ' + error, 4000);
      activateTab('income');
      btnText.removeAttribute('hidden');
      btnLoading.setAttribute('hidden', '');
      calcBtn.removeAttribute('disabled');
      return;
    }

    saveData(data);
    renderResults(data);

    btnText.removeAttribute('hidden');
    btnLoading.setAttribute('hidden', '');
    calcBtn.removeAttribute('disabled');
  }, 50);
}

/* ── Smooth anchor scrolling ─────────────────────────────────────────────── */
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.getElementById(link.getAttribute('href').slice(1));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* ── Keyboard accessibility for tabs ─────────────────────────────────────── */
function initTabKeyboard() {
  const tabBtns = $$('.tab-btn');
  tabBtns.forEach((btn, i) => {
    btn.addEventListener('keydown', e => {
      let next = null;
      if (e.key === 'ArrowRight') next = tabBtns[(i + 1) % tabBtns.length];
      if (e.key === 'ArrowLeft')  next = tabBtns[(i - 1 + tabBtns.length) % tabBtns.length];
      if (next) { next.focus(); next.click(); }
    });
  });
}

/* ── Init ────────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  // Theme
  initTheme();
  $('#darkModeToggle').addEventListener('click', toggleTheme);

  // Tabs
  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });
  initTabKeyboard();

  // Tab navigation buttons
  $('#next-to-expenses').addEventListener('click', () => activateTab('expenses'));
  $('#back-to-income').addEventListener('click',   () => activateTab('income'));
  $('#next-to-goals').addEventListener('click',    () => activateTab('goals'));
  $('#back-to-expenses').addEventListener('click', () => activateTab('expenses'));

  // Live totals – income inputs
  ['#income-salary', '#income-side', '#income-other'].forEach(sel => {
    $(sel).addEventListener('input', updateIncomeTotal);
  });

  // Live totals – expense inputs
  [
    '#exp-housing', '#exp-utilities', '#exp-transport', '#exp-fuel',
    '#exp-groceries', '#exp-dining', '#exp-entertainment',
    '#exp-debt', '#exp-insurance', '#exp-savings', '#exp-other',
  ].forEach(sel => {
    $(sel).addEventListener('input', updateExpenseTotal);
  });

  // Calculate
  $('#calculate-btn').addEventListener('click', handleCalculate);

  // Reset & Share
  $('#reset-btn').addEventListener('click', resetAll);
  $('#share-btn').addEventListener('click', shareScore);

  // Restore saved data
  const saved = loadData();
  if (saved) {
    restoreForm(saved);
    updateIncomeTotal();
    updateExpenseTotal();
    showToast('Your previous data has been restored. 💾', 3000);
  }

  // Smooth scroll
  initSmoothScroll();

});
