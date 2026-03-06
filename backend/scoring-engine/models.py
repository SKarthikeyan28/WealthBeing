from pydantic import BaseModel
from typing import Optional


class VitalScore(BaseModel):
    score: float
    status: str        # "healthy" | "monitor" | "critical"
    label: str
    weight: float
    explanation: Optional[str] = None


class ScoreRequest(BaseModel):
    """Accepts the full portfolio JSON (same shape as alex_portfolio.json)."""
    patient: dict
    net_worth: float
    assets: dict
    liabilities: dict
    cashflow: dict
    transactions: list
    goals: list
    scoring_inputs: dict
    net_worth_history: Optional[list] = None


class ScoreResponse(BaseModel):
    wws: int
    health_label: str
    diagnosis_summary: str
    prescribed_actions: list[str]
    vitals: dict[str, VitalScore]
    critical_vitals: list[str]
