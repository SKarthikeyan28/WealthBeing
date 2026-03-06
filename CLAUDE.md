# WealthBeing — Project Reference & Development Guide

## 1. Project Overview

WealthBeing is a **Wealth Wellness Hub** built for a fintech hackathon. It is a financial health dashboard themed around a **medical check-up**. The app computes a single **Wealth Wellness Score (WWS, 0–1000)** that functions like a patient's overall health score — broken into financial "vitals" such as diversification, liquidity, behavioural resilience, savings rate, and debt health.

**The medical metaphor lives entirely in language, information architecture, and interaction design — NOT in visuals.** The aesthetic is sleek, dark, and premium. No hospital imagery, no red crosses, no medical clipart.

| Medical Term | WealthBeing Meaning |
|---|---|
| Health Score | Wealth Wellness Score (0–1000) |
| Vitals | Financial metrics (diversification, liquidity, etc.) |
| Diagnosis | Score breakdown with pillar analysis |
| Prescription (Rx) | AI-generated action recommendations |
| Treatment Plan | Scenario sandbox (model interventions) |
| Clinical View | Adviser persona mode |
| Prescribed Action | The one clear action at the end of every AI response |
| Critical Vital | A metric below threshold requiring attention |

**Demo persona:** Alex Johnson — 32 y/o Singapore professional, S$342,000 net worth, WWS 724 ("Moderate Health").

---

## 2. Tech Stack

### Frontend
| Tool | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| Vite | 5 | Build tool |
| TypeScript | 5 | Type safety |
| Tailwind CSS | v3 | Styling |
| Recharts | 2 | Charts (radar, line, bar, area) |
| Framer Motion | 11 | Animations |
| Zustand | 4 | Global state (portfolio, wws, persona, sentiment) |
| React Query | 5 | Server state / API calls |
| Fontsource DM Sans | — | Font |

### Backend (5 Python FastAPI microservices)
| Service | Port | Responsibility |
|---|---|---|
| API Gateway | 8000 | Public entry point — routing + dashboard aggregation |
| Portfolio Service | 8001 | Serves mock portfolio data |
| Scoring Engine | 8002 | Computes WWS using all 5 pillar algorithms |
| Simulation Service | 8003 | Monte Carlo + deterministic sandbox |
| Adviser Service | 8004 | Claude API proxy + prompt construction |

### Infrastructure
| Tool | Purpose |
|---|---|
| Docker + Docker Compose | Local development — all 5 services |
| Railway | Backend deployment (gateway = public, rest = internal) |
| Vercel | Frontend deployment |

---

## 3. Architecture Diagram

```
Browser (Vercel)
│
│   React 18 + Vite + Tailwind
│   Zustand (portfolio, wws, persona, sentiment)
│   React Query (all API calls via /api/*)
│
└──► API Gateway  :8000  (Railway — public URL)
         │
         ├──► Portfolio Service  :8001  (Railway internal)
         │         └── GET /portfolio
         │         └── GET /portfolio/history
         │         └── GET /portfolio/cashflow
         │
         ├──► Scoring Engine    :8002  (Railway internal)
         │         └── POST /score
         │         └── POST /score/explain
         │
         ├──► Simulation Service :8003  (Railway internal)
         │         └── POST /sandbox
         │         └── POST /sandbox/monte-carlo
         │
         └──► Adviser Service   :8004  (Railway internal)
                   └── POST /adviser/chat
                   └── GET  /adviser/insights
```

**Key design:** The Gateway's `GET /api/dashboard` calls Portfolio Service and Scoring Engine **in parallel** using `asyncio.gather`, then merges both responses into a single payload. This is the architectural showcase — service composition without tight coupling.

---

## 4. Repository Structure

```
wealthbeing/
├── CLAUDE.md                         ← this file
├── .gitignore
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx
│       ├── App.tsx                   ← routing + persona toggle wrapper
│       ├── constants/
│       │   ├── theme.ts              ← ALL copy strings, colour tokens, status labels
│       │   └── api.ts                ← base URL + React Query client setup
│       ├── store/
│       │   └── index.ts              ← Zustand store (portfolio, wws, persona, sentiment)
│       ├── hooks/
│       │   ├── usePortfolio.ts       ← React Query: GET /api/portfolio
│       │   ├── useScore.ts           ← React Query: POST /api/score
│       │   ├── useSandbox.ts         ← React Query: POST /api/sandbox
│       │   └── useAdviser.ts         ← React Query: POST /api/adviser/chat
│       ├── components/
│       │   ├── Layout.tsx            ← sidebar nav + header + persona toggle
│       │   ├── ScoreDial.tsx         ← animated SVG arc gauge (custom, not Recharts)
│       │   ├── VitalBar.tsx          ← single pillar progress bar with status badge
│       │   ├── StatusBadge.tsx       ← "Healthy" / "Monitor" / "Critical" pill
│       │   ├── RxCard.tsx            ← Prescription insight card
│       │   └── ClinicalNoteInput.tsx ← Add Clinical Note (adviser mode only)
│       └── panels/
│           ├── Pulse.tsx             ← Score dial + vital readings + sparkline
│           ├── Vitals.tsx            ← Radar chart + 8-metric scorecard
│           ├── PrescriptionPad.tsx   ← AI adviser chat + sentiment selector + Rx cards
│           ├── TreatmentPlan.tsx     ← Sandbox sliders + Monte Carlo chart
│           ├── FinancialAnatomy.tsx  ← Asset bars + liability table + goal tracker
│           └── CashFlow.tsx          ← Income/expense KPIs + category chart
│
└── backend/
    ├── docker-compose.yml
    ├── .env.example
    │
    ├── gateway/
    │   ├── Dockerfile
    │   ├── requirements.txt
    │   └── main.py
    │
    ├── portfolio-service/
    │   ├── Dockerfile
    │   ├── requirements.txt
    │   ├── main.py
    │   ├── models.py
    │   ├── aggregator.py
    │   └── data/
    │       └── alex_portfolio.json   ← single source of truth for all mock data
    │
    ├── scoring-engine/
    │   ├── Dockerfile
    │   ├── requirements.txt
    │   ├── main.py
    │   ├── models.py
    │   └── algorithms/
    │       ├── __init__.py
    │       ├── diversification.py
    │       ├── liquidity.py
    │       ├── behavioral.py
    │       ├── growth_momentum.py
    │       └── risk_reward.py
    │
    ├── simulation-service/
    │   ├── Dockerfile
    │   ├── requirements.txt
    │   ├── main.py
    │   ├── monte_carlo.py
    │   └── scenarios.py
    │
    └── adviser-service/
        ├── Dockerfile
        ├── requirements.txt
        ├── main.py
        ├── prompt_builder.py
        └── sentiment.py
```

---

## 5. API Contracts

All calls go through the gateway at `http://localhost:8000` (local) or the Railway public URL (deployed).

### GET /api/dashboard
**Response:**
```json
{
  "patient": { "name": "Alex Johnson", "age": 32, "location": "Singapore" },
  "net_worth": 342000,
  "net_worth_history": [
    { "month": "Aug 2024", "value": 298000 },
    { "month": "Sep 2024", "value": 305000 },
    { "month": "Oct 2024", "value": 310000 },
    { "month": "Nov 2024", "value": 316000 },
    { "month": "Dec 2024", "value": 320000 },
    { "month": "Jan 2025", "value": 331000 },
    { "month": "Feb 2025", "value": 342000 }
  ],
  "wws": 724,
  "health_label": "Moderate Health",
  "diagnosis_summary": "Strong growth momentum offset by a liquidity gap and concentration risk.",
  "vitals": {
    "diversification":  { "score": 74, "status": "healthy", "label": "Portfolio Diversity",      "weight": 0.18 },
    "liquidity":        { "score": 67, "status": "monitor", "label": "Liquidity Coverage",       "weight": 0.20 },
    "behavioral":       { "score": 82, "status": "healthy", "label": "Behavioural Resilience",   "weight": 0.10 },
    "growth_momentum":  { "score": 73, "status": "monitor", "label": "Growth Momentum",          "weight": 0.27 },
    "risk_reward":      { "score": 61, "status": "monitor", "label": "Risk-Reward Alignment",    "weight": 0.25 }
  },
  "critical_vitals": ["liquidity", "risk_reward"],
  "prescribed_actions": [
    "Increase emergency fund from 4.2 to 6 months of expenses",
    "Rebalance NVDA position from 38% to below 35% of equity"
  ]
}
```

### POST /api/score
**Request:** Full portfolio JSON (same shape as alex_portfolio.json)
**Response:** Same shape as the `wws + vitals + health_label + diagnosis_summary + prescribed_actions` fields above.

### POST /api/score/explain
**Request:** Same as /api/score
**Response:** Adds `explanation` field per vital with friendly label and human-readable breakdown.

### POST /api/sandbox
**Request:**
```json
{
  "extra_savings": 1000,
  "debt_payoff": 0,
  "equity_rebalance": 0.0,
  "passive_income_increase": 0
}
```
**Response:**
```json
{
  "new_wws": 768,
  "wws_delta": 44,
  "updated_vitals": { "...same shape as vitals above..." },
  "projection_12m": 367000,
  "diagnosis_summary": "Improved growth momentum; liquidity still requires monitoring."
}
```

### POST /api/sandbox/monte-carlo
**Request:**
```json
{
  "scenario": "market_crash_30",
  "adjustments": { "extra_savings": 500, "debt_payoff": 0, "equity_rebalance": 0.0 }
}
```
**Response:**
```json
{
  "scenario_label": "Market Stress Test",
  "trajectories": {
    "p10": [342000, 320000, 310000, 298000, 285000, 275000, 265000, 258000, 252000, 248000, 245000, 243000],
    "p50": [342000, 335000, 332000, 330000, 331000, 334000, 338000, 341000, 344000, 347000, 350000, 354000],
    "p90": [342000, 348000, 358000, 368000, 376000, 382000, 388000, 393000, 398000, 402000, 406000, 412000]
  },
  "wws_delta": -38,
  "projected_net_worth_12m": 354000
}
```

### POST /api/adviser/chat
**Request:**
```json
{
  "message": "Am I healthy enough to retire at 60?",
  "sentiment": "confident"
}
```
**Response:**
```json
{
  "response": "Based on your current Wealth Health Score of 724 (Moderate Health)...\n\nPrescribed Action: Increase your monthly CPF top-up by S$500 to close the retirement gap within 8 years."
}
```

### GET /api/adviser/insights
**Response:**
```json
{
  "insights": [
    {
      "id": "rx-001",
      "vital": "liquidity",
      "title": "Emergency Fund Gap",
      "body": "Your liquidity coverage sits at 4.2 months — below the 6-month target. A shortfall of ~S$7,200.",
      "prescribed_action": "Redirect S$600/month to your emergency fund for 12 months."
    },
    {
      "id": "rx-002",
      "vital": "risk_reward",
      "title": "Concentration Risk: NVDA",
      "body": "NVDA accounts for 38% of your equity portfolio — above the 35% safe threshold.",
      "prescribed_action": "Sell 5% of NVDA and reallocate to a broad ETF (e.g., VOO)."
    },
    {
      "id": "rx-003",
      "vital": "growth_momentum",
      "title": "Savings Rate Below Target",
      "body": "Current savings rate: 22%. Target: 30%. At current rate, retirement gap widens by ~S$45,000 by age 45.",
      "prescribed_action": "Automate an additional S$800/month transfer to investments on payday."
    }
  ]
}
```

---

## 6. Mock Data — alex_portfolio.json

This file is the **single source of truth** for all demo data. It is loaded by the Portfolio Service at startup. The Scoring Engine receives this data and computes WWS. The values below are engineered to produce **exactly WWS 724**.

### Engineered Metric Targets

| Metric | Value | Status | Demo Narrative |
|---|---|---|---|
| Emergency Fund | S$25,200 (4.2 months) | Monitor | Below 6-month target — visible red flag |
| Savings Rate | 22% | Monitor | Below 30% — sandbox slider fixes this |
| Top Holding (NVDA) | 38% of equity | Monitor | Above 35% — rebalancing story |
| Behavioural Resilience | 82/100 | Healthy | 1 panic-sell event in March 2025 |
| Portfolio Diversity | 74/100 | Healthy | 6 asset classes, solid spread |
| Debt-to-Asset Ratio | 24% | Healthy | Below 30% threshold |
| Net Worth | S$342,000 | — | Realistic SG young professional |
| YoY Net Worth Growth | 14.8% | — | From S$298k (Aug 2024) to S$342k |

### Top-Level Shape
```json
{
  "patient": { "name": "Alex Johnson", "age": 32, "location": "Singapore" },
  "net_worth": 342000,
  "net_worth_history": [ ... 7 monthly snapshots Aug 2024 – Feb 2025 ... ],
  "assets": {
    "equities": {
      "total": 145000,
      "holdings": [
        { "ticker": "NVDA",  "name": "NVIDIA Corp",        "value": 55100, "pct_of_equity": 0.38 },
        { "ticker": "VOO",   "name": "Vanguard S&P 500",   "value": 40000, "pct_of_equity": 0.28 },
        { "ticker": "AAPL",  "name": "Apple Inc",          "value": 22000, "pct_of_equity": 0.15 },
        { "ticker": "QQQ",   "name": "Invesco NASDAQ-100", "value": 15000, "pct_of_equity": 0.10 },
        { "ticker": "TSLA",  "name": "Tesla Inc",          "value": 12900, "pct_of_equity": 0.09 }
      ]
    },
    "cpf": { "ordinary_account": 68000, "special_account": 31000, "medisave": 18000 },
    "cash": { "emergency_fund": 25200, "savings_account": 14800 },
    "crypto": { "total": 18000, "holdings": [{ "coin": "BTC", "value": 12000 }, { "coin": "ETH", "value": 6000 }] },
    "real_estate": { "type": "HDB", "current_value": 580000, "outstanding_loan": 410000, "equity": 170000 },
    "bonds": { "total": 12000, "holdings": [{ "name": "Singapore Savings Bonds", "value": 12000 }] }
  },
  "liabilities": {
    "hdb_mortgage": { "outstanding": 410000, "monthly_payment": 1800, "rate": 0.026, "years_remaining": 22 },
    "credit_card": { "outstanding": 2400, "limit": 15000 }
  },
  "cashflow": {
    "monthly_income": 8500,
    "monthly_expenses": {
      "housing": 1800,
      "food": 800,
      "transport": 300,
      "insurance": 350,
      "entertainment": 400,
      "utilities": 150,
      "other": 300
    },
    "monthly_savings": 1870,
    "savings_rate": 0.22
  },
  "transactions": [
    { "date": "2025-03-15", "type": "panic_sell",  "ticker": "NVDA", "value": 8000, "reactive": true,  "note": "Sold during tariff news" },
    { "date": "2024-11-02", "type": "buy",          "ticker": "VOO",  "value": 5000, "reactive": false, "note": "Scheduled DCA" },
    { "date": "2024-09-18", "type": "reactive_buy", "ticker": "TSLA", "value": 3000, "reactive": true,  "note": "Bought on hype" }
  ],
  "goals": [
    { "id": "g1", "name": "Emergency Fund Top-Up", "target": 36000, "current": 25200, "deadline": "2025-12-31" },
    { "id": "g2", "name": "Japan Holiday",         "target": 8000,  "current": 3200,  "deadline": "2025-09-01" },
    { "id": "g3", "name": "Early Retirement Fund", "target": 800000, "current": 342000, "deadline": "2043-01-01" }
  ],
  "scoring_inputs": {
    "asset_class_allocations": {
      "equities":    0.424,
      "cpf":         0.343,
      "real_estate": 0.497,
      "cash":        0.117,
      "crypto":      0.053,
      "bonds":       0.035
    },
    "top_holding_pct": 0.38,
    "expected_annual_return": 0.087,
    "portfolio_volatility": 0.142,
    "yoy_net_worth_growth": 0.148
  }
}
```

---

## 7. Scoring Engine — Algorithm Reference

### Pillar Weights
| Pillar | Weight | Key Input |
|---|---|---|
| Diversification | 18% | Shannon entropy across asset class allocations |
| Liquidity | 20% | Emergency fund months coverage + liquid asset ratio |
| Behavioural Resilience | 10% | Panic sells + reactive trades from transaction history |
| Growth Momentum | 27% | Savings rate vs 30% target + YoY net worth growth |
| Risk-Reward Alignment | 25% | Sharpe proxy − concentration penalty |

### Formula
```
WWS = round(Σ(pillar_score × weight) × 10)   →   0 – 1000 scale
```

### Status Thresholds (per pillar, 0–100)
| Score Range | Status | UI Label |
|---|---|---|
| 75–100 | `healthy` | Healthy Range |
| 50–74 | `monitor` | Requires Monitoring |
| 0–49 | `critical` | Critical |

### WWS Health Labels
| WWS Range | Label |
|---|---|
| 900–1000 | Excellent Health |
| 750–899 | Good Health |
| 600–749 | Moderate Health |
| 400–599 | Requires Attention |
| 0–399 | Critical |

---

## 8. Colour Palette & Design Tokens

```ts
// theme.ts — colour tokens
export const colours = {
  bg:          '#080C14',   // page background
  surface:     '#0F1623',   // card background
  border:      '#1E293B',   // card border
  teal:        '#00D4AA',   // primary accent (score, healthy status)
  tealMuted:   '#00A88B',   // secondary teal
  amber:       '#F59E0B',   // monitor status
  orange:      '#F97316',   // requires attention
  red:         '#EF4444',   // critical status
  purple:      '#7C6FFF',   // adviser / clinical view accent
  textPrimary: '#FFFFFF',
  textMuted:   '#94A3B8',
}

export const statusColour = {
  healthy:  colours.teal,
  monitor:  colours.amber,
  critical: colours.red,
}

export const wwsColour = (score: number) => {
  if (score >= 900) return colours.teal
  if (score >= 750) return colours.tealMuted
  if (score >= 600) return colours.amber
  if (score >= 400) return colours.orange
  return colours.red
}
```

---

## 9. Zustand Store Shape

```ts
// store/index.ts
interface WealthBeingStore {
  // Data
  portfolio: Portfolio | null
  wws: number | null
  vitals: VitalsMap | null
  diagnosisSummary: string | null
  prescribedActions: string[]

  // UI state
  persona: 'CLIENT' | 'ADVISER'        // My Check-Up | Clinical View
  sentiment: 'stressed' | 'unsure' | 'okay' | 'great' | 'celebrating'
  activePanel: PanelId
  clinicalNotes: ClinicalNote[]

  // Sandbox state
  sandboxAdjustments: SandboxAdjustments
  sandboxResult: SandboxResult | null

  // Actions
  setPersona: (p: 'CLIENT' | 'ADVISER') => void
  setSentiment: (s: Sentiment) => void
  setActivePanel: (p: PanelId) => void
  addClinicalNote: (note: ClinicalNote) => void
  setSandboxAdjustment: (key: keyof SandboxAdjustments, value: number) => void
}
```

---

## 10. Adviser System Prompt

Every call to `/api/adviser/chat` uses the following system prompt. The prompt builder interpolates real portfolio values.

```
You are WealthBeing's AI Financial Health Adviser — a clinical expert in personal financial wellness.

PATIENT RECORD:
  Name: {patient_name}, Age: {age}
  Wealth Health Score: {wws}/1000 ({health_label})
  Vital Readings:
    - Portfolio Diversity:      {diversification}/100 ({div_status})
    - Liquidity Coverage:       {liquidity}/100 ({liq_status})
    - Behavioural Resilience:   {behavioral}/100 ({beh_status})
    - Growth Momentum:          {growth}/100 ({grw_status})
    - Risk-Reward Alignment:    {risk_reward}/100 ({rsk_status})
  Net Worth: S${net_worth}
  Monthly Cash Flow: Income S${income} | Expenses S${expenses} | Savings Rate {savings_rate}%
  Top 3 Holdings: {top_3}
  Critical Vitals: {critical_vitals}
  Patient Sentiment: {sentiment}

BEDSIDE MANNER:
  - stressed/anxious  → Calm, reassuring. Lead with what is healthy. Defer complex decisions.
  - celebrating       → Affirming. "Clean bill of health" tone. Acknowledge milestone.
  - unsure/confused   → Educational, patient. Explain ONE concept clearly. One next step only.
  - great/confident   → Ambitious. Growth-oriented. Highlight optimisation opportunities.
  - okay/neutral      → Standard clinical assessment. Balanced and professional.

RESPONSE FORMAT:
  1. Assessment    (1 short paragraph — what the vitals show)
  2. Diagnosis     (1 short paragraph — root cause of any flags)
  3. Prescription  (numbered list of 2–3 specific, actionable steps with real numbers)
  4. End with exactly one line: "Prescribed Action: [single most important action today]"

RULES:
  - Always reference specific numbers from the patient record. Never give generic advice.
  - Never exceed 4 paragraphs total.
  - Never suggest seeking a financial adviser — you ARE the financial adviser.
```

---

## 11. Development Roadmap — Phased & Parallelised

The roadmap is split into **4 phases**. Each phase has tasks distributed across **Dev A**, **Dev B**, and **Dev C** so all three can work concurrently. Each developer works on a separate Git branch and merges at the end of each phase.

### Git Branch Strategy

```
main
├── phase/1-foundation
│   ├── feat/dev-a-portfolio-service
│   ├── feat/dev-b-frontend-scaffold
│   └── feat/dev-c-scoring-engine
├── phase/2-core-features
│   ├── feat/dev-a-simulation-adviser
│   ├── feat/dev-b-pulse-vitals-cashflow
│   └── feat/dev-c-prescription-treatment
├── phase/3-integration
│   ├── feat/dev-a-api-gateway
│   ├── feat/dev-b-anatomy-persona
│   └── feat/dev-c-frontend-wiring
└── phase/4-polish
    └── (all 3 devs work on the same branch or own sub-branches)
```

**Merge order within each phase:** All dev branches → phase branch → main. Resolve conflicts at the phase merge, not mid-phase.

---

### PHASE 1 — Foundation
**Goal:** Everyone has something runnable by end of phase. No cross-dependencies.

#### Dev A — Portfolio Service + Docker Compose
Branch: `feat/dev-a-portfolio-service`

**Tasks:**
1. Create `backend/` root with `docker-compose.yml` and `.env.example`
2. Create `backend/portfolio-service/` with Dockerfile + `requirements.txt` (`fastapi`, `uvicorn`, `pydantic`)
3. Implement `alex_portfolio.json` — full mock data as specified in Section 6
4. Implement `portfolio-service/models.py` — Pydantic schemas for Asset, Liability, CashFlow, Transaction, Goal
5. Implement `portfolio-service/aggregator.py`:
   - `get_net_worth(portfolio)` — sums all asset values minus liabilities
   - `get_asset_class_buckets(portfolio)` — returns dict of class → total value + pct
   - `get_liquid_assets(portfolio)` — cash + money market only
6. Implement `portfolio-service/main.py` with endpoints:
   - `GET /portfolio` — full portfolio JSON
   - `GET /portfolio/history` — net worth history array
   - `GET /portfolio/cashflow` — income/expense breakdown
   - `GET /portfolio/assets` — asset class buckets with percentages
   - `GET /health` — returns `{"status": "ok"}`
7. Add stub entries for all other services in `docker-compose.yml` (they can point to placeholder images, other devs will fill them in)

**Definition of done:** `docker-compose up portfolio-service` starts without error. `curl localhost:8001/portfolio` returns full Alex JSON.

---

#### Dev B — Frontend Scaffold + Shared Components + Theme
Branch: `feat/dev-b-frontend-scaffold`

**Tasks:**
1. Scaffold with `npm create vite@latest frontend -- --template react-ts`
2. Install: `tailwindcss`, `@tailwindcss/forms`, `framer-motion`, `recharts`, `zustand`, `@tanstack/react-query`, `axios`, `@fontsource/dm-sans`
3. Configure Tailwind with custom colours and font (DM Sans as `fontFamily.sans`)
4. Create `src/constants/theme.ts`:
   - All colour tokens (Section 8)
   - `PANEL_NAMES` map: `{ pulse: 'Pulse', vitals: 'Vitals', prescription: 'Prescription Pad', ... }`
   - `STATUS_LABELS` map: `{ healthy: 'Healthy Range', monitor: 'Requires Monitoring', critical: 'Critical' }`
   - `SENTIMENT_OPTIONS` array with label + emoji
   - `PROMPT_CHIPS` array: all 4 suggested questions
   - `HEALTH_LABEL(wws)` function
   - `STATUS_COLOUR(status)` function
5. Create `src/constants/api.ts` — base URL from env var, axios instance
6. Create `src/store/index.ts` — full Zustand store as specified in Section 9
7. Implement `src/components/Layout.tsx`:
   - Left sidebar with 6 nav items using panel names from theme.ts
   - Header with "Annual Wealth Check-Up — Alex Johnson" and persona toggle (My Check-Up / Clinical View)
   - Content area slot
8. Implement shared components:
   - `ScoreDial.tsx` — custom SVG arc gauge, animates 0 → score in 1.8s on mount. Props: `score`, `max=1000`, `label`
   - `VitalBar.tsx` — labelled progress bar with `StatusBadge`. Props: `label`, `score`, `weight`, `status`
   - `StatusBadge.tsx` — coloured pill. Props: `status: 'healthy' | 'monitor' | 'critical'`
   - `RxCard.tsx` — prescription insight card. Props: `vital`, `title`, `body`, `prescribedAction`, `onAddNote?` (adviser mode)
9. Create placeholder panel files (`Pulse.tsx`, `Vitals.tsx`, etc.) that just render their panel name so routing works
10. Set up React Router with 6 routes, one per panel

**Definition of done:** `npm run dev` loads the app, sidebar navigation works, all 6 placeholder panels render, persona toggle switches header badge.

---

#### Dev C — Scoring Engine
Branch: `feat/dev-c-scoring-engine`

**Tasks:**
1. Create `backend/scoring-engine/` with Dockerfile + `requirements.txt` (`fastapi`, `uvicorn`, `pydantic`, `numpy`)
2. Implement all 5 algorithm files in `algorithms/`:

   **`diversification.py`**
   ```python
   import numpy as np
   def compute(allocations: dict) -> float:
       weights = np.array(list(allocations.values()), dtype=float)
       weights /= weights.sum()
       entropy = -np.sum(weights * np.log(weights + 1e-9))
       max_entropy = np.log(max(len(weights), 2))
       return round(min(100.0, (entropy / max_entropy) * 100), 2)
   ```

   **`liquidity.py`**
   ```python
   def compute(emergency_fund, monthly_expenses, liquid_assets, total_assets) -> float:
       months = emergency_fund / (monthly_expenses + 0.01)
       coverage = min(80.0, (months / 6) * 80)
       ratio = min(20.0, (liquid_assets / (total_assets + 0.01)) * 20)
       return round(coverage + ratio, 2)
   ```

   **`behavioral.py`**
   ```python
   def compute(transactions: list) -> float:
       panic = sum(1 for t in transactions if t.get("type") == "panic_sell")
       reactive = sum(1 for t in transactions if t.get("reactive", False))
       return round(max(0.0, min(100.0, 100 - panic * 15 - reactive * 5)), 2)
   ```

   **`growth_momentum.py`**
   ```python
   def compute(savings_rate, yoy_growth, target=0.30) -> float:
       s = min(70.0, (savings_rate / target) * 70)
       g = min(30.0, max(0.0, yoy_growth * 100))
       return round(s + g, 2)
   ```

   **`risk_reward.py`**
   ```python
   def compute(top_holding_pct, expected_return, volatility) -> float:
       sharpe = (expected_return - 0.04) / (volatility + 0.001)
       sharpe_score = min(70.0, max(0.0, sharpe * 35))
       penalty = max(0.0, (top_holding_pct - 0.35) * 100)
       return round(max(0.0, min(100.0, sharpe_score - penalty + 30)), 2)
   ```

3. Implement `scoring-engine/models.py` — Pydantic request/response schemas matching the API contract in Section 5
4. Implement `scoring-engine/main.py`:
   - `POST /score` — accepts portfolio data, runs all 5 algorithms, returns full response
   - `POST /score/explain` — same but adds plain-language explanation per vital
   - `GET /health`
   - `compute_wws(pillar_scores)` function using the weight map
   - `get_health_label(wws)` and `get_status(score)` helper functions
   - `get_diagnosis_summary(vitals)` — generates a 1-sentence summary based on which vitals are healthy/monitor/critical
   - `get_prescribed_actions(vitals, portfolio)` — returns 2–3 specific action strings

**Definition of done:** `docker-compose up scoring-engine` starts. `curl -X POST localhost:8002/score -d @alex_portfolio.json` returns `{"wws": 724, ...}` (verify the number matches).

---

**Phase 1 Merge:** All three branches → `phase/1-foundation` → review together → merge to `main`.

---

### PHASE 2 — Core Features
**Goal:** Each panel that exists in Phase 1 as a placeholder is now fully built. Backend simulation and adviser services are live.

#### Dev A — Simulation Service + Adviser Service
Branch: `feat/dev-a-simulation-adviser`

**Tasks — Simulation Service:**
1. Create `backend/simulation-service/` with Dockerfile + `requirements.txt` (`fastapi`, `uvicorn`, `pydantic`, `numpy`)
2. Implement `scenarios.py`:
   ```python
   SCENARIOS = {
     "market_crash_30":  { "label": "Market Stress Test",       "equity_shock": -0.30, "vol_mult": 2.5 },
     "bull_run_25":      { "label": "Optimal Recovery",         "equity_shock":  0.25, "vol_mult": 0.7 },
     "rate_hike":        { "label": "Rate Hike Stress",         "equity_shock": -0.05, "bond_shock": -0.10, "vol_mult": 1.3 },
     "conservative":     { "label": "Conservative Prognosis",   "equity_shock":  0.03, "vol_mult": 0.8 },
   }
   ```
3. Implement `monte_carlo.py`:
   - Accept portfolio + scenario key + adjustments
   - Apply scenario shocks to base expected returns
   - Run 1000 paths over 12 months using numpy random with Cholesky-correlated returns (equity, bonds, cash, crypto correlation matrix)
   - Return p10/p50/p90 arrays of length 12
4. Implement `simulation-service/main.py`:
   - `POST /sandbox` — deterministic: apply adjustments to portfolio, call scoring engine via HTTP for new WWS, return delta
   - `POST /sandbox/monte-carlo` — run simulation, return p10/p50/p90 + wws_delta
   - `GET /scenarios` — returns the scenario library with labels
   - `GET /health`

**Tasks — Adviser Service:**
1. Create `backend/adviser-service/` with Dockerfile + `requirements.txt` (`fastapi`, `uvicorn`, `pydantic`, `anthropic`)
2. Implement `sentiment.py` — maps the 5 sentiment states to bedside manner instructions (strings to inject into system prompt)
3. Implement `prompt_builder.py`:
   - `build_system_prompt(portfolio, wws_data, sentiment)` — interpolates all patient values into the system prompt template from Section 10
   - `build_insight_cards(vitals, portfolio)` — generates the 3 pre-computed Rx insight cards
4. Implement `adviser-service/main.py`:
   - `POST /adviser/chat` — builds system prompt, calls Claude API (`claude-sonnet-4-6`), streams response back
   - `GET /adviser/insights` — returns pre-computed insight cards (uses prompt_builder, does NOT call Claude — just generates from data)
   - `GET /health`
5. Use `ANTHROPIC_API_KEY` from environment variable

**Definition of done:** All 4 backend services start with `docker-compose up`. Simulation returns p10/p50/p90 bands. Adviser returns a response that includes "Prescribed Action:" in the text.

---

#### Dev B — Pulse Panel + Vitals Panel + CashFlow Panel
Branch: `feat/dev-b-pulse-vitals-cashflow`

**Tasks — Pulse Panel:**
1. Replace the placeholder `Pulse.tsx` with the full implementation
2. Layout: Score dial (left) + Vital Readings list (right) + net worth sparkline (bottom)
3. `ScoreDial` — use the shared component from Phase 1. Animates to 724 on mount. Show health label below. Colour from `wwsColour(score)`
4. Vital Readings list — map over `vitals` from Zustand, render `VitalBar` for each
5. "3 Vitals Require Attention" banner — appears if any vitals are `monitor` or `critical`, uses count
6. Net worth sparkline — Recharts `AreaChart` with 7-month history data. Teal gradient fill. Show dollar values on Y axis (formatted as S$XXXk)
7. Prescribed Actions section — 2–3 bullet points styled as medical prescriptions (Rx symbol + text)
8. Framer Motion: slide-in on mount for the score dial, stagger the vital bars

**Tasks — Vitals Panel:**
1. Replace placeholder `Vitals.tsx`
2. Radar chart — Recharts `RadarChart` with 5 axes (one per pillar). Two `Radar` components: user scores (teal fill) + peer cohort overlay (purple dashed, static values: 70, 75, 78, 72, 69)
3. 8-metric scorecard below radar — 2-column grid of metric cards:
   - Emergency Fund: 4.2 months (Monitor)
   - Savings Rate: 22% (Monitor)
   - Concentration Risk: 38% NVDA (Monitor)
   - Debt-to-Asset Ratio: 24% (Healthy)
   - Behavioural Resilience: 82/100 (Healthy)
   - Diversification: 74/100 (Healthy)
   - Net Worth Growth: +14.8% YoY (Healthy)
   - Liquidity Ratio: 11.7% (Monitor)
4. Each metric card: label, value, status badge, 1-line clinical note

**Tasks — CashFlow Panel:**
1. Replace placeholder `CashFlow.tsx`
2. Top KPIs: Income S$8,500 | Expenses S$4,100 | Savings S$1,870 | Savings Rate 22%
3. Savings rate gauge: horizontal bar, teal fill to 22%, dashed line at 30% target
4. Expense breakdown: Recharts `BarChart` or `PieChart` — 6 categories (housing, food, transport, insurance, entertainment, utilities)
5. Monthly trend: mini `LineChart` showing last 3 months net savings

**Definition of done:** All 3 panels fully render with the Alex mock data hardcoded in the component (React Query wiring happens in Phase 3).

---

#### Dev C — PrescriptionPad Panel + TreatmentPlan Panel
Branch: `feat/dev-c-prescription-treatment`

**Tasks — PrescriptionPad Panel:**
1. Replace placeholder `PrescriptionPad.tsx`
2. Top section: 3 `RxCard` components using the pre-computed insight data (hardcoded for now, wired in Phase 3)
3. Sentiment selector: 5 buttons (Stressed / Unsure / Okay / Great / Celebrating). Active state highlights in teal. Updates Zustand `sentiment`.
4. Prompt chips: 4 buttons from `PROMPT_CHIPS` in theme.ts. Clicking one populates the input field
5. Chat interface:
   - Message history (user + adviser alternating bubbles)
   - Adviser bubble: white text on dark surface card. "Prescribed Action:" line at bottom styled distinctly (teal left border, slightly inset)
   - User bubble: teal background, right-aligned
   - Input bar with send button
   - Loading state: animated pulse dots while awaiting response
6. In ADVISER mode: each `RxCard` shows "Add Clinical Note" button below it (triggers `ClinicalNoteInput` component)

**Tasks — TreatmentPlan Panel:**
1. Replace placeholder `TreatmentPlan.tsx`
2. Scenario selector: 4 buttons using scenario labels ("Market Stress Test", "Optimal Recovery", etc.)
3. Adjustment sliders (4 total):
   - Extra Monthly Savings: S$0 → S$2,000
   - Debt Payoff Lump Sum: S$0 → S$50,000
   - Equity Rebalance: 0% → 20%
   - Passive Income Increase: S$0 → S$1,000/mo
4. WWS delta display: large "+44 pts" card that updates as sliders change. Colour: green if positive, red if negative
5. Monte Carlo chart: Recharts `AreaChart` with 3 bands (p10 / p50 / p90). p50 = teal solid line. p10/p90 = shaded band. X-axis = 12 months. Y-axis = portfolio value in S$k
6. "Run Simulation" button triggers the Monte Carlo call (hardcoded response for now, wired in Phase 3)
7. Summary card below chart: "Projected Net Worth in 12 months: S$354,000 | WWS Impact: −38 pts"

**Definition of done:** Both panels render fully with all UI elements functional using hardcoded data. Sliders update the delta display. Scenario selector changes the button highlight. Chat UI renders and allows typing (no actual API call yet).

---

**Phase 2 Merge:** All three branches → `phase/2-core-features` → review together → merge to `main`.

---

### PHASE 3 — Integration
**Goal:** Wire frontend to backend. Everything talks to everything. The app works end-to-end.

#### Dev A — API Gateway
Branch: `feat/dev-a-api-gateway`

**Tasks:**
1. Create `backend/gateway/` with Dockerfile + `requirements.txt` (`fastapi`, `uvicorn`, `httpx`)
2. Implement `gateway/main.py`:
   - Configure CORS to allow the Vercel frontend URL (use env var `FRONTEND_URL`)
   - `GET /api/dashboard` — `asyncio.gather` Portfolio + Scoring calls in parallel, merge response
   - `GET /api/portfolio` → proxy to Portfolio Service
   - `GET /api/portfolio/history` → proxy to Portfolio Service
   - `GET /api/portfolio/cashflow` → proxy to Portfolio Service
   - `POST /api/score` → proxy to Scoring Engine
   - `POST /api/score/explain` → proxy to Scoring Engine
   - `POST /api/sandbox` → proxy to Simulation Service (Simulation internally calls Scoring for delta)
   - `POST /api/sandbox/monte-carlo` → proxy to Simulation Service
   - `GET /api/scenarios` → proxy to Simulation Service
   - `POST /api/adviser/chat` → proxy to Adviser Service
   - `GET /api/adviser/insights` → proxy to Adviser Service
   - `GET /health` — fan-out health check to all 4 services, return aggregate status
3. All internal service URLs come from environment variables (`PORTFOLIO_SERVICE_URL`, etc.)
4. Update `docker-compose.yml` to include gateway with all env vars pointing to other services by Docker service name

**Definition of done:** `docker-compose up` starts all 5 services. `curl localhost:8000/api/dashboard` returns the merged response. All gateway routes return data.

---

#### Dev B — FinancialAnatomy Panel + Dual Persona Toggle
Branch: `feat/dev-b-anatomy-persona`

**Tasks — FinancialAnatomy Panel:**
1. Replace placeholder `FinancialAnatomy.tsx`
2. Asset breakdown horizontal bar chart — Recharts `BarChart` stacked or `ComposedChart`. Each asset class a different shade. Labels show S$ value + percentage
3. Asset class cards: Equities (S$145k), CPF (S$117k), Real Estate Equity (S$170k), Cash (S$40k), Crypto (S$18k), Bonds (S$12k)
4. Holdings table for equities: Ticker | Name | Value | % of Equity | Status (flag if >35%)
5. Liabilities section: HDB Mortgage outstanding (S$410k), monthly payment, remaining years. Credit card balance
6. Debt health: horizontal bar showing debt-to-asset at 24% with 30% threshold dashed line
7. Goals tracker ("Recovery Milestones"):
   - Each goal: name, target, current, progress bar, deadline
   - 3 goals from mock data (Emergency Fund Top-Up, Japan Holiday, Retirement Fund)

**Tasks — Dual Persona Toggle (full implementation):**
1. Persona toggle in Layout header is already present from Phase 1 (just toggled in Zustand). Now wire it to all panels:
2. ADVISER mode changes throughout the app:
   - Layout header: badge switches to "Clinical View — Patient: Alex Johnson" with purple accent
   - `RxCard` components: show "Add Clinical Note" button below each
   - Pulse panel: no visual changes (read-only)
   - PrescriptionPad: clinical notes sidebar appears on right side, listing all notes with the vital they reference
3. Clinical Notes sidebar:
   - Title: "Clinical Observations"
   - Each note: timestamp, vital tag, note text
   - Empty state: "No clinical observations yet."
4. Make sure persona toggle state in Zustand persists between panel navigation

**Definition of done:** Persona toggle switches the UI correctly in all panels. FinancialAnatomy renders all sections. Clinical notes can be added and appear in the sidebar.

---

#### Dev C — Frontend API Wiring
Branch: `feat/dev-c-frontend-wiring`

**Tasks:**
1. Implement React Query hooks in `src/hooks/`:
   - `usePortfolio.ts` — `GET /api/dashboard` with 60s stale time. On success, writes to Zustand store
   - `useScore.ts` — `POST /api/score` mutation
   - `useSandbox.ts` — `POST /api/sandbox` mutation, writes result to Zustand `sandboxResult`
   - `useMonteCarlo.ts` — `POST /api/sandbox/monte-carlo` mutation
   - `useAdviserChat.ts` — `POST /api/adviser/chat` mutation with portfolio context from Zustand
   - `useInsights.ts` — `GET /api/adviser/insights` query
2. Wire `usePortfolio` into `App.tsx` — call on mount, populate Zustand store. Show loading skeleton while fetching
3. Wire all panels to read from Zustand store instead of hardcoded data:
   - Pulse: reads `wws`, `vitals`, `net_worth_history`, `prescribedActions` from store
   - Vitals: reads `vitals` from store, pulls metric detail from `portfolio`
   - CashFlow: reads `portfolio.cashflow` from store
   - PrescriptionPad: `useInsights` for Rx cards, `useAdviserChat` for chat, sentiment from store
   - TreatmentPlan: sliders update `sandboxAdjustments` in store, "Run Simulation" calls `useSandbox` then `useMonteCarlo`
   - FinancialAnatomy: reads `portfolio.assets`, `portfolio.liabilities`, `portfolio.goals` from store
4. Error states: show a clinical-themed error card if any API call fails ("Unable to retrieve vital reading")
5. Loading states: skeleton placeholders styled as greyed-out cards
6. Set `VITE_API_BASE_URL` in `.env.local` to point to gateway

**Definition of done:** App fully end-to-end. All panels show real computed data from backend. Sandbox sliders trigger real score recalculation. Chat sends real messages to Claude and shows real Prescribed Actions.

---

**Phase 3 Merge:** All three branches → `phase/3-integration` → full end-to-end test together → merge to `main`.

---

### PHASE 4 — Polish & Demo Prep
**Branch:** All three devs work on `phase/4-polish` (or own sub-branches merged daily)

**Divide by area — assign one area per dev:**

#### Dev A — Animations & Micro-interactions
- Score dial count-up (0 → 724 in 1.8s) using Framer Motion
- Vital bars: stagger entrance animation (each bar slides in 100ms after the previous)
- Panel transitions: fade + slight upward slide when switching panels
- Sandbox delta: number flips when slider changes (like a flip counter)
- RxCard: hover lifts card slightly (scale 1.02, shadow deepens)

#### Dev B — Mobile Responsiveness & Deployment
- Bottom tab bar on mobile (390px) — 6 icons, no labels, teal active indicator
- Sidebar on desktop (1440px) — full labels visible
- All panels: single-column stacked layout on mobile
- Test all charts on small screens (Recharts is responsive by default, but check overflow)
- Deploy backend to Railway (set env vars, test gateway URL)
- Deploy frontend to Vercel (set `VITE_API_BASE_URL` to Railway gateway)
- Verify CORS is correctly set, all API calls succeed from deployed URL

#### Dev C — Demo Pre-testing & Adviser Prompt Tuning
- Pre-test all 5 sentiment states: send same message with each sentiment, verify visibly different tone
- Pre-test all 4 prompt chips: "What's my biggest financial health risk?" etc. — every response must cite Alex's specific numbers and end with "Prescribed Action:"
- Pre-test the sandbox demo moment: sliders to $1,000 extra savings → confirm WWS jumps to ~768 (+44)
- Pre-test Monte Carlo: "Market Stress Test" → confirm p10 is clearly lower than p90 (not a flat line)
- Run through the full verification checklist from Section 12

---

**Phase 4 Merge:** Sub-branches → `phase/4-polish` → full demo run-through → merge to `main` → final deployment.

---

## 12. Verification Checklist

Run through this before the judging session:

- [ ] `docker-compose up` starts all 5 containers without error
- [ ] `GET /api/dashboard` returns `wws: 724` and `health_label: "Moderate Health"`
- [ ] `POST /api/score` with alex_portfolio.json returns `wws: 724` (exact)
- [ ] Sandbox: extra_savings slider $0 → $1,000 → wws_delta ≈ +40–50 pts
- [ ] Monte Carlo: "Market Stress Test" → p10 is clearly below p50, p90 clearly above (not flat)
- [ ] AI chat: sentiment "stressed" → calm bedside manner tone
- [ ] AI chat: sentiment "confident" → ambitious growth tone
- [ ] Every AI response ends with "Prescribed Action:"
- [ ] Prompt chip "Write me a 90-day treatment plan" → response cites Alex's real numbers
- [ ] Score dial animates 0 → 724 in ~1.8s on page load
- [ ] "3 Vitals Require Attention" banner appears on Pulse panel
- [ ] Persona toggle: Clinical View shows "Clinical View — Patient: Alex Johnson" in purple
- [ ] Clinical Note can be added in ADVISER mode and appears in sidebar
- [ ] Radar chart: peer cohort dashed overlay renders alongside user pillars
- [ ] All 6 panels load without errors on desktop (1440px)
- [ ] All 6 panels load without errors on mobile (390px) with bottom tab nav
- [ ] Vercel frontend reaches Railway gateway (no CORS errors in browser console)
- [ ] All 4 prompt chips produce specific, portfolio-grounded responses

---

## 13. Environment Variables

### Backend `.env.example`
```
ANTHROPIC_API_KEY=sk-ant-...
PORTFOLIO_SERVICE_URL=http://portfolio-service:8001
SCORING_ENGINE_URL=http://scoring-engine:8002
SIMULATION_SERVICE_URL=http://simulation-service:8003
ADVISER_SERVICE_URL=http://adviser-service:8004
FRONTEND_URL=https://wealthbeing.vercel.app
```

### Frontend `.env.local` (not committed)
```
VITE_API_BASE_URL=http://localhost:8000
```

### Frontend `.env.production` (committed, safe)
```
VITE_API_BASE_URL=https://wealthbeing-gateway.railway.app
```

---

## 14. Running Locally

```bash
# Backend — all 5 services
cd backend
cp .env.example .env          # fill in ANTHROPIC_API_KEY
docker-compose up --build

# Frontend
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                   # http://localhost:5173
```

Each service also has a `GET /health` endpoint. Check all are up:
```bash
curl localhost:8000/health    # gateway (fan-out to all)
curl localhost:8001/health    # portfolio-service
curl localhost:8002/health    # scoring-engine
curl localhost:8003/health    # simulation-service
curl localhost:8004/health    # adviser-service
```
