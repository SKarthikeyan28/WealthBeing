import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="WealthBeing API Gateway", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

PORTFOLIO_URL = os.getenv("PORTFOLIO_SERVICE_URL", "http://localhost:8001")
SCORING_URL = os.getenv("SCORING_ENGINE_URL", "http://localhost:8002")
SIMULATION_URL = os.getenv("SIMULATION_SERVICE_URL", "http://localhost:8003")
ADVISER_URL = os.getenv("ADVISER_SERVICE_URL", "http://localhost:8004")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/dashboard")
async def get_dashboard():
    """
    Aggregates portfolio + scoring data — fetches portfolio, then scores it, merges both.
    """
    async with httpx.AsyncClient(timeout=10.0) as client:
        portfolio_res = await client.get(f"{PORTFOLIO_URL}/portfolio")
    portfolio = portfolio_res.json()

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
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(f"{SIMULATION_URL}/sandbox", json=body)
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
