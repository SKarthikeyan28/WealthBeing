# WealthBeing

**WealthBeing** is a Wealth Wellness Hub — a personal financial health dashboard themed entirely around a medical check-up. Instead of charts and spreadsheets, your finances are presented as vitals, diagnoses, and prescriptions.

Live demo: [wealth-being-g54e.vercel.app](https://wealth-being-g54e.vercel.app)

---

## What it does

Enter your financial data (income, savings, assets, debts) and WealthBeing computes your **Wealth Wellness Score (WWS)** — a single number from 0 to 1000 that works like a patient health score. The score breaks down into five financial "vitals":

| Vital | What it measures |
|---|---|
| Portfolio Diversity | How well-spread your assets are across classes |
| Liquidity Coverage | Emergency fund depth and liquid asset ratio |
| Behavioural Resilience | Panic sells and reactive trading history |
| Growth Momentum | Savings rate vs target and year-on-year net worth growth |
| Risk-Reward Alignment | Sharpe proxy minus concentration penalty |

Each vital is rated **Healthy**, **Requires Monitoring**, or **Critical** — just like a clinic report.

---

## Features

- **Personal portfolio form** — enter your own numbers to get a real, computed WWS
- **Demo mode** — explore the app using a pre-built demo persona (Alex Johnson, S$342k net worth, WWS 724) without signing up
- **User accounts** — register and save your portfolio data across sessions
- **AI Financial Adviser** — sentiment-aware chat powered by Claude that gives portfolio-grounded advice and always ends with a concrete "Prescribed Action"
- **Prescription Pad** — pre-computed Rx insight cards flagging your critical vitals with specific actions
- **Treatment Plan** — sandbox sliders (extra savings, debt payoff, equity rebalance) with real-time WWS delta and a Monte Carlo projection chart
- **Financial Anatomy** — asset breakdown, holdings table, liabilities, debt health, and goal tracker
- **Cash Flow** — income/expense KPIs, savings rate gauge, and expense category chart
- **Clinical View** — adviser persona mode with clinical notes sidebar

---

## Tech Stack

### Frontend
- **React 18** + **Vite** + **TypeScript**
- **Tailwind CSS** for styling, **Framer Motion** for animations
- **Recharts** for radar, area, bar, and line charts
- **Zustand** for global state, **React Query** for server state

### Backend (5 Python FastAPI microservices)

| Service | Responsibility |
|---|---|
| API Gateway | Public entry point — routing, CORS, dashboard aggregation |
| Portfolio Service | Serves mock and user portfolio data |
| Scoring Engine | Computes WWS using 5 pillar algorithms |
| Simulation Service | Monte Carlo + deterministic sandbox |
| Adviser Service | Claude API proxy + prompt construction |

### Infrastructure
- **Docker + Docker Compose** for local development
- **Railway** for backend deployment (gateway public, other services internal)
- **Vercel** for frontend deployment
- **PostgreSQL** (Railway-hosted) for user accounts and saved portfolios

---

## Architecture

```
Browser (Vercel)
└──► API Gateway (Railway — public)
         ├──► Portfolio Service  (internal)
         ├──► Scoring Engine     (internal)
         ├──► Simulation Service (internal)
         ├──► Adviser Service    (internal)
         └──► User Service       (internal) ── PostgreSQL
```

`GET /api/dashboard` calls the Portfolio Service and Scoring Engine in parallel via `asyncio.gather`, merging both into a single response — no sequential waiting.

---

## Running Locally

### Backend

```bash
cd backend
cp .env.example .env       # add your ANTHROPIC_API_KEY
docker-compose up --build  # starts all 5 services
```

Health checks:
```bash
curl localhost:8000/health  # gateway (fan-out to all services)
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local  # set VITE_API_BASE_URL=http://localhost:8000
npm install
npm run dev                        # http://localhost:5173
```

---

## Scoring Algorithm

```
WWS = round( Σ(pillar_score × weight) × 10 )   →   0–1000
```

| Pillar | Weight |
|---|---|
| Diversification | 18% |
| Liquidity | 20% |
| Behavioural Resilience | 10% |
| Growth Momentum | 27% |
| Risk-Reward Alignment | 25% |

| WWS | Label |
|---|---|
| 900–1000 | Excellent Health |
| 750–899 | Good Health |
| 600–749 | Moderate Health |
| 400–599 | Requires Attention |
| 0–399 | Critical |
