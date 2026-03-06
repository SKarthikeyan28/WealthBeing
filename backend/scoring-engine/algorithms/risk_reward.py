def compute(top_holding_pct: float, expected_return: float, volatility: float) -> float:
    """Sharpe proxy minus concentration penalty, normalised to 0–100."""
    sharpe = (expected_return - 0.04) / (volatility + 0.001)
    sharpe_score = min(70.0, max(0.0, sharpe * 35))
    penalty = max(0.0, (top_holding_pct - 0.35) * 100)
    return round(max(0.0, min(100.0, sharpe_score - penalty + 30)), 2)
