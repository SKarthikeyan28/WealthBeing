SCENARIOS: dict[str, dict] = {
    "market_crash_30": {
        "label": "Market Stress Test",
        "equity_shock": -0.30,
        "vol_mult": 2.5,
    },
    "bull_run_25": {
        "label": "Optimal Recovery",
        "equity_shock": 0.25,
        "vol_mult": 0.7,
    },
    "rate_hike": {
        "label": "Rate Hike Stress",
        "equity_shock": -0.05,
        "bond_shock": -0.10,
        "vol_mult": 1.3,
    },
    "conservative": {
        "label": "Conservative Prognosis",
        "equity_shock": 0.03,
        "vol_mult": 0.8,
    },
}
