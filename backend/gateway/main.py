import os
import asyncio
import httpx
from fastapi import FastAPI, HTTPException, Request
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
USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://localhost:8005")


@app.get("/health")
async def health():
    """Fan-out health check to all downstream services."""
    services = {
        "portfolio": PORTFOLIO_URL,
        "scoring": SCORING_URL,
        "simulation": SIMULATION_URL,
        "adviser": ADVISER_URL,
        "user": USER_SERVICE_URL,
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
async def get_dashboard(request: Request):
    """
    If Authorization header present, use user's stored portfolio; else demo.
    """
    portfolio = None
    auth = request.headers.get("Authorization")
    if auth:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(f"{USER_SERVICE_URL}/portfolio", headers={"Authorization": auth})
        if res.status_code == 200:
            portfolio = res.json()
        elif res.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
    if portfolio is None:
        async with httpx.AsyncClient(timeout=10.0) as client:
            portfolio_res = await client.get(f"{PORTFOLIO_URL}/portfolio")
        if portfolio_res.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"Portfolio service error ({portfolio_res.status_code}): {portfolio_res.text[:200] if portfolio_res.text else 'empty response'}",
            )
        portfolio = portfolio_res.json()

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            score_res = await client.post(f"{SCORING_URL}/score", json=portfolio)
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Scoring engine unreachable: {e!s}")
    if score_res.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Scoring engine error ({score_res.status_code}): {score_res.text[:200] if score_res.text else 'empty response'}",
        )
    try:
        score_data = score_res.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Scoring engine returned invalid JSON")
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
    # Fetch portfolio and current WWS so simulation can compute a real wws_delta
    async with httpx.AsyncClient(timeout=10.0) as client:
        portfolio_res = await client.get(f"{PORTFOLIO_URL}/portfolio")
    portfolio = portfolio_res.json()

    async with httpx.AsyncClient(timeout=10.0) as client:
        score_res = await client.post(f"{SCORING_URL}/score", json=portfolio)
    current_wws = score_res.json().get("wws", 72)

    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(
            f"{SIMULATION_URL}/sandbox/monte-carlo",
            json={**body, "portfolio": portfolio, "current_wws": current_wws},
        )
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


# ---- Auth & user portfolio ----
@app.post("/api/auth/register")
async def auth_register(request: Request):
    body = await request.json()
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(f"{USER_SERVICE_URL}/register", json=body)
    if res.status_code >= 400:
        raise HTTPException(status_code=res.status_code, detail=res.json().get("detail", "Error"))
    return res.json()


@app.post("/api/auth/login")
async def auth_login(request: Request):
    body = await request.json()
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(f"{USER_SERVICE_URL}/login", json=body)
    if res.status_code >= 400:
        raise HTTPException(status_code=res.status_code, detail=res.json().get("detail", "Error"))
    return res.json()


@app.get("/api/auth/me")
async def auth_me(request: Request):
    auth = request.headers.get("Authorization")
    if not auth:
        raise HTTPException(status_code=401, detail="Missing authorization")
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.get(f"{USER_SERVICE_URL}/me", headers={"Authorization": auth})
    if res.status_code >= 400:
        raise HTTPException(status_code=res.status_code, detail=res.json().get("detail", "Error"))
    return res.json()


@app.get("/api/user/portfolio")
async def user_get_portfolio(request: Request):
    auth = request.headers.get("Authorization")
    if not auth:
        raise HTTPException(status_code=401, detail="Missing authorization")
    month = request.query_params.get("month")
    url = f"{USER_SERVICE_URL}/portfolio"
    if month:
        url = f"{url}?month={month}"
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.get(url, headers={"Authorization": auth})
    if res.status_code == 404:
        raise HTTPException(status_code=404, detail="No portfolio saved")
    if res.status_code >= 400:
        raise HTTPException(status_code=res.status_code, detail=res.json().get("detail", "Error"))
    return res.json()


@app.put("/api/user/portfolio")
async def user_put_portfolio(request: Request):
    auth = request.headers.get("Authorization")
    if not auth:
        raise HTTPException(status_code=401, detail="Missing authorization")
    body = await request.json()
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.put(f"{USER_SERVICE_URL}/portfolio", json=body, headers={"Authorization": auth})
    if res.status_code >= 400:
        raise HTTPException(status_code=res.status_code, detail=res.json().get("detail", "Error"))
    return res.json()


@app.get("/api/user/portfolio/snapshots")
async def user_get_portfolio_snapshots(request: Request):
    auth = request.headers.get("Authorization")
    if not auth:
        raise HTTPException(status_code=401, detail="Missing authorization")
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.get(f"{USER_SERVICE_URL}/portfolio/snapshots", headers={"Authorization": auth})
    if res.status_code >= 400:
        raise HTTPException(status_code=res.status_code, detail=res.json().get("detail", "Error"))
    return res.json()
