def compute(savings_rate: float, yoy_growth: float, target: float = 0.30) -> float:
    """Savings rate vs target + YoY net worth growth, normalised to 0–100."""
    s = min(70.0, (savings_rate / target) * 70)
    g = min(30.0, max(0.0, yoy_growth * 100))
    return round(s + g, 2)
