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
    return round(total * 10)  # 0–1000 scale


def get_diagnosis_summary(vitals: dict) -> str:
    """Generate a 1-sentence summary based on which vitals are healthy/monitor/critical."""
    critical = [k for k, d in vitals.items() if d["status"] == "critical"]
    monitor = [k for k, d in vitals.items() if d["status"] == "monitor"]
    if critical:
        return f"Critical vitals in {', '.join(critical)}. Immediate action recommended."
    if monitor:
        if "liquidity" in monitor and "risk_reward" in monitor:
            return "Strong growth momentum offset by a liquidity gap and concentration risk."
        return f"Strong foundation offset by monitoring flags in: {', '.join(monitor)}."
    return "All vitals are in a healthy range. Maintain your current trajectory."


def get_prescribed_actions(vitals: dict, portfolio: dict) -> list[str]:
    """Return 2–3 specific action strings using portfolio numbers."""
    actions = []
    assets = portfolio.get("assets") or {}
    cashflow = portfolio.get("cashflow") or {}
    expenses = cashflow.get("monthly_expenses") or {}
    monthly_expenses = sum(expenses.values()) if isinstance(expenses, dict) else 0
    emergency_fund = (assets.get("cash") or {}).get("emergency_fund") or 0
    months_ef = round(emergency_fund / (monthly_expenses + 0.01), 1) if monthly_expenses else 0

    if vitals.get("liquidity", {}).get("status") in ("monitor", "critical"):
        actions.append(f"Increase emergency fund from {months_ef} to 6 months of expenses")
    if vitals.get("risk_reward", {}).get("status") in ("monitor", "critical"):
        equities = assets.get("equities") or {}
        holdings = equities.get("holdings") or []
        if holdings:
            top = holdings[0]
            name = top.get("ticker", "top holding")
            pct = int((top.get("pct_of_equity") or 0) * 100)
            actions.append(f"Rebalance {name} position from {pct}% to below 35% of equity")
        else:
            actions.append("Rebalance top equity holding to below 35% of equity")
    if vitals.get("growth_momentum", {}).get("status") in ("monitor", "critical"):
        actions.append("Automate an additional monthly transfer to investments on payday")
    return actions[:3] if actions else ["Continue your current financial routine — all vitals are healthy."]


def get_vital_explanations(vitals: dict, portfolio: dict) -> dict[str, str]:
    """Return a short human-readable explanation for each vital."""
    assets = portfolio.get("assets") or {}
    cashflow = portfolio.get("cashflow") or {}
    expenses = cashflow.get("monthly_expenses") or {}
    monthly_expenses = sum(expenses.values()) if isinstance(expenses, dict) else 0
    emergency_fund = (assets.get("cash") or {}).get("emergency_fund") or 0
    months_ef = round(emergency_fund / (monthly_expenses + 0.01), 1) if monthly_expenses else 0
    savings_rate_pct = int((cashflow.get("savings_rate") or 0) * 100)
    si = portfolio.get("scoring_inputs") or {}
    yoy_pct = round((si.get("yoy_net_worth_growth") or 0) * 100, 1)
    top_pct = int((si.get("top_holding_pct") or 0) * 100)
    equities = assets.get("equities") or {}
    holdings = equities.get("holdings") or []
    top_name = holdings[0].get("ticker", "top holding") if holdings else "equity"

    return {
        "diversification": f"Portfolio is spread across multiple asset classes (entropy-based). Score {vitals['diversification']['score']}/100 — {'healthy spread' if vitals['diversification']['status'] == 'healthy' else 'consider diversifying further'}.",
        "liquidity": f"Emergency fund covers {months_ef} months of expenses (target 6). Liquid assets ratio contributes to the score. {vitals['liquidity']['label']}: {vitals['liquidity']['score']}/100.",
        "behavioral": f"Based on transaction history (panic sells and reactive trades). Fewer emotional trades mean a higher score. {vitals['behavioral']['label']}: {vitals['behavioral']['score']}/100.",
        "growth_momentum": f"Savings rate {savings_rate_pct}% vs 30% target, plus YoY net worth growth {yoy_pct}%. Combined into {vitals['growth_momentum']['label']}: {vitals['growth_momentum']['score']}/100.",
        "risk_reward": f"Risk-adjusted return (Sharpe proxy) minus concentration penalty. {top_name} at {top_pct}% of equity. {vitals['risk_reward']['label']}: {vitals['risk_reward']['score']}/100.",
    }


def _run_scoring(portfolio: dict) -> tuple[dict, int, str, str, list[str], list[str]]:
    si = portfolio["scoring_inputs"]
    cashflow = portfolio["cashflow"]
    transactions = portfolio["transactions"]
    assets = portfolio["assets"]

    monthly_expenses = sum(cashflow["monthly_expenses"].values())
    emergency_fund = assets["cash"]["emergency_fund"]
    liquid_assets = assets["cash"]["emergency_fund"] + assets["cash"]["savings_account"]
    liabilities = portfolio.get("liabilities") or {}
    total_liabilities = (liabilities.get("hdb_mortgage") or {}).get("outstanding", 0) + (liabilities.get("credit_card") or {}).get("outstanding", 0)
    total_assets = portfolio["net_worth"] + total_liabilities

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
    try:
        vitals, wws, health_label, diagnosis, actions, critical_vitals = _run_scoring(body)
    except Exception as e:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=500,
            content={"detail": "Scoring failed", "error": str(e)},
        )
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
    explanations = get_vital_explanations(vitals, body)
    for name, v in vitals.items():
        v["explanation"] = explanations.get(name, "")
    return {
        "wws": wws,
        "health_label": health_label,
        "diagnosis_summary": diagnosis,
        "prescribed_actions": actions,
        "vitals": vitals,
        "critical_vitals": critical_vitals,
    }
