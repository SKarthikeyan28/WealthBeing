def compute(transactions: list) -> float:
    """Penalise panic sells and reactive trades from transaction history."""
    panic = sum(1 for t in transactions if t.get("type") == "panic_sell")
    reactive = sum(1 for t in transactions if t.get("reactive", False))
    return round(max(0.0, min(100.0, 100 - panic * 15 - reactive * 5)), 2)
