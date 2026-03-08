import json
import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import Portfolio
from aggregator import get_asset_class_buckets

app = FastAPI(title="WealthBeing Portfolio Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = Path(__file__).parent / "data" / "alex_portfolio.json"
_portfolio_data: dict = {}


@app.on_event("startup")
def load_data():
    global _portfolio_data
    with open(DATA_PATH) as f:
        _portfolio_data = json.load(f)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/portfolio")
def get_portfolio():
    return _portfolio_data


@app.get("/portfolio/history")
def get_history():
    return _portfolio_data.get("net_worth_history", [])


@app.get("/portfolio/cashflow")
def get_cashflow():
    return _portfolio_data.get("cashflow", {})


@app.get("/portfolio/assets")
def get_assets():
    portfolio_obj = Portfolio(**_portfolio_data)
    buckets = get_asset_class_buckets(portfolio_obj)
    return {k: {"total": v.total, "pct": v.pct} for k, v in buckets.items()}
