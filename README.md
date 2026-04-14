# FinanceFit 💰

**Free Personal Financial Health Score & Budget Planner**

> Know your financial health in 2 minutes. No login required. 100% private.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue)](https://myg-1107.github.io/Develop/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 Product Overview

**FinanceFit** helps people understand their personal financial health by:

- Calculating a **Financial Health Score** (0–100) based on savings rate, debt-to-income ratio, and emergency fund coverage
- Providing a **budget breakdown** with the 50/30/20 rule analysis
- Tracking **savings goals** and **debt payoff** timelines
- Delivering a **personalised action plan** with specific, actionable steps

### Problem it solves
66% of Americans can't cover a $1,000 emergency, and 57% feel anxious about their finances — not because they don't care, but because financial tools are either too complex, too expensive, or require surrendering personal data. FinanceFit gives everyone instant, private, free access to meaningful financial insights.

### Target audience
Working adults, students, and young professionals who want to understand and improve their financial situation without paying for a financial advisor.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🏆 Financial Health Score | 0–100 score based on 4 weighted components |
| 📊 Budget Breakdown | Visual spending bars with percentage of income |
| 💡 50/30/20 Rule Analysis | See how your spending compares to the recommended split |
| 🎯 Savings Goal Tracker | Set a target and see months to reach it |
| 🏦 Debt Payoff Calculator | Amortisation-based timeline with total interest cost |
| ✅ Action Plan | Personalised, prioritised steps based on your numbers |
| 🌙 Dark Mode | Respects system preference; manually toggleable |
| 💾 Auto-Save | Form data persists in localStorage between sessions |
| 📤 Share | Share your score via Web Share API or clipboard |

---

## 🏗 Architecture

```
Develop/
├── index.html              # Main frontend (SEO-optimised)
├── css/
│   └── styles.css          # Design system + responsive layout
├── js/
│   ├── calculator.js       # Pure financial calculation functions
│   └── app.js              # DOM interactions & state management
├── backend/
│   ├── server.js           # Express API server
│   ├── package.json
│   ├── .env.example        # Environment variable template
│   ├── routes/
│   │   └── scores.js       # POST/GET /api/scores
│   └── tests/
│       └── calculator.test.js  # Unit tests (Node.js built-in runner)
├── sitemap.xml
├── robots.txt
└── README.md
```

### Data flow
1. User fills form → JavaScript calculates everything client-side (no data leaves the browser)
2. Results rendered instantly in the Results panel
3. **Optional**: Click "Share My Score" → score snapshot POSTed to backend API → share link returned

### API Endpoints

```
GET  /api/health           Health check
POST /api/scores           Save a score snapshot
     Body: { score, grade, metrics }
     Returns: { id, expiresAt }

GET  /api/scores/:id       Retrieve saved snapshot (expires after 7 days)
```

---

## 💻 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES2020) |
| Backend | Node.js 18+, Express 4 |
| Storage (frontend) | localStorage |
| Storage (backend) | In-memory Map (swap for MongoDB/Redis in production) |
| Deployment (frontend) | GitHub Pages |
| Deployment (backend) | Render / Railway / Fly.io (free tier) |

---

## 🚀 Quick Start

### Frontend (no build step required)

```bash
# Clone the repo
git clone https://github.com/MYG-1107/Develop.git
cd Develop

# Open in browser directly
open index.html
# or use a local server:
npx serve .
```

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev     # development
npm start       # production
```

---

## 🌐 Deployment

### Frontend → GitHub Pages

1. Go to your repository **Settings → Pages**
2. Set source to **Deploy from a branch**
3. Select `main` branch, `/ (root)` folder
4. Click **Save** — your site will be live at `https://your-username.github.io/Develop/`

### Backend → Render (free tier)

1. Create a free account at [render.com](https://render.com)
2. Click **New → Web Service**
3. Connect your GitHub repo, set root directory to `backend/`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variable: `ALLOWED_ORIGIN=https://your-username.github.io`
7. Deploy — Render gives you a URL like `https://financefit-api.onrender.com`

### Connect frontend to backend

In `js/app.js`, update the `BACKEND_URL` constant (add to the top of the file):

```js
const BACKEND_URL = 'https://financefit-api.onrender.com';
```

Then in the `shareScore()` function, POST the score to the API and share the returned URL.

---

## 🧪 Running Tests

```bash
cd backend
npm install
npm test
```

Tests use Node.js's built-in test runner (no external dependencies). They cover:
- All calculator functions
- Edge cases (zero values, infinite results, invalid inputs)

---

## 🔐 Security

- **Input sanitisation**: All inputs validated as non-negative finite numbers
- **No personal data stored**: The frontend never sends financial numbers to the server
- **Helmet.js**: Security headers on all API responses
- **Rate limiting**: 100 requests / 15 min per IP
- **CORS**: Only configured origins can access the API
- **Payload size limit**: `express.json({ limit: '16kb' })`
- **Environment variables**: Secrets in `.env` (excluded from git)

---

## 📈 Scalability & Future Improvements

| Idea | Impact |
|------|--------|
| MongoDB / Firestore for persistent score sharing | High |
| User accounts with history dashboard | High |
| AI-powered personalised advice via OpenAI API | Medium |
| PDF export of financial health report | Medium |
| Budgeting categories with transaction import (CSV) | High |
| PWA (offline support, home screen install) | Medium |
| Multi-currency support | Low |

### Ethical Monetisation Ideas
- **Freemium**: Free core tool; paid "FinanceFit Pro" with history, PDF reports, advisor matching
- **Affiliate**: Links to partner banks/saving apps only when genuinely helpful (clearly disclosed)
- **API**: White-label the calculator for financial education platforms

---

## 🎨 Design

- **Colours**: Primary `#2563EB` (blue), Secondary `#10B981` (green), Accent `#F59E0B` (amber)
- **Typography**: Inter (Google Fonts) — clean, highly legible
- **Responsive**: Mobile-first with breakpoints at 480px, 768px, 1024px
- **Accessibility**: WCAG 2.1 AA — semantic HTML, ARIA labels, keyboard navigation, skip links, sufficient colour contrast

---

## 📄 License

MIT © 2025 FinanceFit