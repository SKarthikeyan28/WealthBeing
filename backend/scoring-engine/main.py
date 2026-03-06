from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import ScoreRequest, ScoreResponse, VitalScore
from algorithms import (
    compute_diversification,
    compute_liquidity,
    compute_behavioral,
    compute_growth_momentum,
    compute_risk_reward,
)

app = FastAPI(title="WealthBeing Scoring Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

PILLAR_WEIGHTS = {
    "diversification":  0.18,
    "liquidity":        0.20,
    "behavioral":       0.10,
    "growth_momentum":  0.27,
    "risk_reward":      0.25,
}

PILLAR_LABELS = {
    "diversification":  "Portfolio Diversity",
    "liquidity":        "Liquidity Coverage",
    "behavioral":       "Behavioural Resilience",
    "growth_momentum":  "Growth Momentum",
    "risk_reward":      "Risk-Reward Alignment",
}


def get_status(score: float) -> str:
    if score >= 75:
        return "healthy"
    if score >= 50:
        return "monitor"
    return "critical"


def get_health_label(wws: int) -> str:
    if wws >= 900:
        return "Excellent Health"
    if wws >= 750:
        return "Good Health"
    if wws >= 600:
        return "Moderate Health"
    if wws >= 400:
        return "Requires Attention"
    return "Critical"


def compute_wws(pillar_scores: dict[str, float]) -> int:
    total = sum(pillar_scores[p] * PILLAR_WEIGHTS[p] for p in pillar_scores)
    return round(total * 10)


def get_diagnosis_summary(vitals: dict) -> str:
    # TODO: generate a meaningful 1-sentence summary based on vital statuses
    critical = [v for v, d in vitals.items() if d["status"] == "critical"]
    monitor = [v for v, d in vitals.items() if d["status"] == "monitor"]
    if critical:
        return f"Critical vitals detected in: {', '.join(critical)}. Immediate action recommended."
    if monitor:
        return f"Strong foundation offset by monitoring flags in: {', '.join(monitor)}."
    return "All vitals are in a healthy range. Maintain your current trajectory."


def get_prescribed_actions(vitals: dict, portfolio: dict) -> list[str]:
    # TODO: generate specific prescribed actions from vital flags and portfolio data
    actions = []
    if vitals.get("liquidity", {}).get("status") in ("monitor", "critical"):
        actions.append("Increase emergency fund to 6 months of expenses.")
    if vitals.get("risk_reward", {}).get("status") in ("monitor", "critical"):
        actions.append("Rebalance top equity holding to below 35% of portfolio.")
    if vitals.get("growth_momentum", {}).get("status") in ("monitor", "critical"):
        actions.append("Automate an additional monthly transfer to investments.")
    return actions or ["Continue your current financial routine — all vitals are healthy."]


def _run_scoring(portfolio: dict) -> tuple[dict, int, str, list[str], list[str]]:
    si = portfolio["scoring_inputs"]
    cashflow = portfolio["cashflow"]
    transactions = portfolio["transactions"]
    assets = portfolio["assets"]

    monthly_expenses = sum(cashflow["monthly_expenses"].values())
    emergency_fund = assets["cash"]["emergency_fund"]
    liquid_assets = assets["cash"]["emergency_fund"] + assets["cash"]["savings_account"]
    total_assets = portfolio["net_worth"] + portfolio.get("liabilities", {}).get("hdb_mortgage", {}).get("outstanding", 0)

    raw_scores = {
        "diversification": compute_diversification(si["asset_class_allocations"]),
        "liquidity":       compute_liquidity(emergency_fund, monthly_expenses, liquid_assets, total_assets),
        "behavioral":      compute_behavioral(transactions),
        "growth_momentum": compute_growth_momentum(cashflow["savings_rate"], si["yoy_net_worth_growth"]),
        "risk_reward":     compute_risk_reward(si["top_holding_pct"], si["expected_annual_return"], si["portfolio_volatility"]),
    }

    vitals = {
        name: {
            "score": round(score),
            "status": get_status(score),
            "label": PILLAR_LABELS[name],
            "weight": PILLAR_WEIGHTS[name],
        }
        for name, score in raw_scores.items()
    }

    wws = compute_wws(raw_scores)
    health_label = get_health_label(wws)
    critical_vitals = [name for name, v in vitals.items() if v["status"] in ("monitor", "critical")]
    diagnosis = get_diagnosis_summary(vitals)
    actions = get_prescribed_actions(vitals, portfolio)

    return vitals, wws, health_label, diagnosis, actions, critical_vitals


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/score")
def post_score(body: dict):
    vitals, wws, health_label, diagnosis, actions, critical_vitals = _run_scoring(body)
    return {
        "wws": wws,
        "health_label": health_label,
        "diagnosis_summary": diagnosis,
        "prescribed_actions": actions,
        "vitals": vitals,
        "critical_vitals": critical_vitals,
    }


@app.post("/score/explain")
def post_score_explain(body: dict):
    vitals, wws, health_label, diagnosis, actions, critical_vitals = _run_scoring(body)
    # TODO: add per-vital plain-language explanation field
    for name, v in vitals.items():
        v["explanation"] = f"[TODO: human-readable explanation for {name}]"
    return {
        "wws": wws,
        "health_label": health_label,
        "diagnosis_summary": diagnosis,
        "prescribed_actions": actions,
        "vitals": vitals,
        "critical_vitals": critical_vitals,
    }
