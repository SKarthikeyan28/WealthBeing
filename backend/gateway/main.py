import os
import asyncio
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="WealthBeing API Gateway", version="1.0.0")

_frontend_url = os.getenv("FRONTEND_URL", "")
_allowed_origins = ["http://localhost:5173", "http://localhost:3000"]
if _frontend_url:
    _allowed_origins.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)

PORTFOLIO_URL = os.getenv("PORTFOLIO_SERVICE_URL", "http://localhost:8001")
SCORING_URL = os.getenv("SCORING_ENGINE_URL", "http://localhost:8002")
SIMULATION_URL = os.getenv("SIMULATION_SERVICE_URL", "http://localhost:8003")
ADVISER_URL = os.getenv("ADVISER_SERVICE_URL", "http://localhost:8004")


@app.get("/health")
async def health():
    """Fan-out health check to all 4 downstream services."""
    services = {
        "portfolio": PORTFOLIO_URL,
        "scoring": SCORING_URL,
        "simulation": SIMULATION_URL,
        "adviser": ADVISER_URL,
    }

    async def check(name: str, base_url: str) -> tuple[str, str]:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{base_url}/health")
            return name, "ok" if res.status_code == 200 else "degraded"
        except Exception:
            return name, "unreachable"

    results = await asyncio.gather(*[check(n, u) for n, u in services.items()])
    statuses = dict(results)
    aggregate = "ok" if all(v == "ok" for v in statuses.values()) else "degraded"
    return {"status": aggregate, "services": statuses}


@app.get("/api/dashboard")
async def get_dashboard():
    """
    Aggregates portfolio + scoring data — fetches portfolio, then scores it in parallel.
    """
    async with httpx.AsyncClient(timeout=10.0) as client:
        portfolio_res = await client.get(f"{PORTFOLIO_URL}/portfolio")
    portfolio = portfolio_res.json()

    # Score is dependent on portfolio data, so run sequentially
    async with httpx.AsyncClient(timeout=10.0) as client:
        score_res = await client.post(f"{SCORING_URL}/score", json=portfolio)
    score_data = score_res.json()

    return {**portfolio, **score_data}


@app.get("/api/portfolio")
async def get_portfolio():
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.get(f"{PORTFOLIO_URL}/portfolio")
    return res.json()


@app.get("/api/portfolio/history")
async def get_portfolio_history():
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.get(f"{PORTFOLIO_URL}/portfolio/history")
    return res.json()


@app.get("/api/portfolio/cashflow")
async def get_portfolio_cashflow():
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.get(f"{PORTFOLIO_URL}/portfolio/cashflow")
    return res.json()


@app.get("/api/portfolio/assets")
async def get_portfolio_assets():
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.get(f"{PORTFOLIO_URL}/portfolio/assets")
    return res.json()


@app.post("/api/score")
async def post_score(body: dict):
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(f"{SCORING_URL}/score", json=body)
    return res.json()


@app.post("/api/score/explain")
async def post_score_explain(body: dict):
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(f"{SCORING_URL}/score/explain", json=body)
    return res.json()


@app.post("/api/sandbox")
async def post_sandbox(body: dict):
    # Fetch portfolio so simulation service can score the modified version
    async with httpx.AsyncClient(timeout=10.0) as client:
        portfolio_res = await client.get(f"{PORTFOLIO_URL}/portfolio")
    portfolio = portfolio_res.json()

    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(f"{SIMULATION_URL}/sandbox", json={"portfolio": portfolio, "adjustments": body})
    return res.json()


@app.post("/api/sandbox/monte-carlo")
async def post_monte_carlo(body: dict):
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(f"{SIMULATION_URL}/sandbox/monte-carlo", json=body)
    return res.json()


@app.get("/api/scenarios")
async def get_scenarios():
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.get(f"{SIMULATION_URL}/scenarios")
    return res.json()


@app.post("/api/adviser/chat")
async def post_adviser_chat(body: dict):
    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.post(f"{ADVISER_URL}/adviser/chat", json=body)
    return res.json()


@app.get("/api/adviser/insights")
async def get_adviser_insights():
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.get(f"{ADVISER_URL}/adviser/insights")
    return res.json()
