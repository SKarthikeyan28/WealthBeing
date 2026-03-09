import os
import httpx
import anthropic
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from prompt_builder import build_system_prompt, build_insight_cards

app = FastAPI(title="WealthBeing Adviser Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
PORTFOLIO_URL = os.getenv("PORTFOLIO_SERVICE_URL", "http://localhost:8001")
MODEL = "claude-sonnet-4-6"


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/adviser/chat")
async def post_adviser_chat(body: dict):
    """
    Build system prompt from portfolio + wws data, call Claude, return response.
    Expects: { message, sentiment, portfolio, wws_data }
    """
    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set")

    message = body.get("message", "")
    sentiment = body.get("sentiment", "okay")
    portfolio = body.get("portfolio", {})
    wws_data = body.get("wws_data", {})

    system_prompt = build_system_prompt(portfolio, wws_data, sentiment)

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    response = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system=system_prompt,
        messages=[{"role": "user", "content": message}],
    )

    return {"response": response.content[0].text}


_FALLBACK_PORTFOLIO = {
    "cashflow": {
        "monthly_expenses": {"housing": 1800, "food": 800, "transport": 300, "insurance": 350, "entertainment": 400, "utilities": 150, "other": 300},
        "savings_rate": 0.22,
    },
    "assets": {"cash": {"emergency_fund": 25200}},
    "scoring_inputs": {"top_holding_pct": 0.38},
}


@app.get("/adviser/insights")
async def get_adviser_insights():
    """Return pre-computed Rx insight cards — no Claude call, generated from live portfolio data."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(f"{PORTFOLIO_URL}/portfolio")
        portfolio = res.json()
    except Exception:
        portfolio = _FALLBACK_PORTFOLIO

    cards = build_insight_cards({}, portfolio)
    return {"insights": cards}
