import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from monte_carlo import run_monte_carlo
from scenarios import SCENARIOS

app = FastAPI(title="WealthBeing Simulation Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SCORING_URL = os.getenv("SCORING_ENGINE_URL", "http://localhost:8002")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/scenarios")
def get_scenarios():
    return {k: {"label": v["label"]} for k, v in SCENARIOS.items()}


@app.post("/sandbox")
async def post_sandbox(body: dict):
    """
    Deterministic sandbox: apply adjustments to portfolio, fetch new WWS from scoring engine.
    """
    portfolio = body.get("portfolio", {})
    adjustments = body.get("adjustments", {})

    # Apply adjustments to portfolio copy
    modified = dict(portfolio)
    extra_savings = adjustments.get("extra_savings", 0)
    if extra_savings and "cashflow" in modified:
        modified["cashflow"] = dict(modified["cashflow"])
        new_savings = modified["cashflow"].get("monthly_savings", 0) + extra_savings
        modified["cashflow"]["monthly_savings"] = new_savings
        # Recalculate savings_rate so scoring engine picks up the improvement
        monthly_income = modified["cashflow"].get("monthly_income", 1) or 1
        modified["cashflow"]["savings_rate"] = round(new_savings / monthly_income, 4)

    # Get new score from scoring engine
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(f"{SCORING_URL}/score", json=modified)
    score_data = res.json()

    original_wws = body.get("current_wws", 724)
    new_wws = score_data.get("wws", original_wws)

    return {
        "new_wws": new_wws,
        "wws_delta": new_wws - original_wws,
        "updated_vitals": score_data.get("vitals", {}),
        "projection_12m": round(portfolio.get("net_worth", 342000) * 1.087 + extra_savings * 12),
        "diagnosis_summary": score_data.get("diagnosis_summary", ""),
    }


def _apply_scenario_shocks(portfolio: dict, scenario: dict) -> dict:
    """Apply scenario shocks to scoring_inputs so the engine can compute a realistic new WWS."""
    import copy
    shocked = copy.deepcopy(portfolio)
    equity_shock = scenario.get("equity_shock", 0.0)
    vol_mult = scenario.get("vol_mult", 1.0)
    si = shocked.get("scoring_inputs", {})
    equity_alloc = si.get("asset_class_allocations", {}).get("equities", 0.42)
    si["expected_annual_return"] = max(0.0, si.get("expected_annual_return", 0.087) + equity_shock * equity_alloc)
    si["portfolio_volatility"] = si.get("portfolio_volatility", 0.142) * vol_mult
    si["yoy_net_worth_growth"] = max(-0.5, si.get("yoy_net_worth_growth", 0.148) + equity_shock * equity_alloc)
    shocked["scoring_inputs"] = si
    return shocked


@app.post("/sandbox/monte-carlo")
async def post_monte_carlo(body: dict):
    scenario_key = body.get("scenario", "conservative")
    adjustments = body.get("adjustments", {})
    portfolio = body.get("portfolio", {"net_worth": 342000})
    current_wws = body.get("current_wws", 724)

    if scenario_key not in SCENARIOS:
        raise HTTPException(status_code=400, detail=f"Unknown scenario: {scenario_key}")

    result = run_monte_carlo(portfolio, scenario_key, adjustments)
    scenario = SCENARIOS[scenario_key]
    scenario_label = scenario["label"]

    # Compute wws_delta by scoring the shocked portfolio
    shocked = _apply_scenario_shocks(portfolio, scenario)
    async with httpx.AsyncClient(timeout=10.0) as client:
        score_res = await client.post(f"{SCORING_URL}/score", json=shocked)
    new_wws = score_res.json().get("wws", current_wws)
    wws_delta = new_wws - current_wws

    return {
        "scenario_label": scenario_label,
        "trajectories": result,
        "wws_delta": wws_delta,
        "projected_net_worth_12m": result["p50"][-1],
    }
