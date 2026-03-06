def compute(emergency_fund: float, monthly_expenses: float, liquid_assets: float, total_assets: float) -> float:
    """Emergency fund months coverage + liquid asset ratio, normalised to 0–100."""
    months = emergency_fund / (monthly_expenses + 0.01)
    coverage = min(80.0, (months / 6) * 80)
    ratio = min(20.0, (liquid_assets / (total_assets + 0.01)) * 20)
    return round(coverage + ratio, 2)
