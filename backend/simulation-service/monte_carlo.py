import numpy as np
from scenarios import SCENARIOS


# Correlation matrix: [equities, bonds, cash, crypto]
CORRELATION = np.array([
    [1.00,  0.10,  0.00,  0.30],
    [0.10,  1.00,  0.05, -0.05],
    [0.00,  0.05,  1.00,  0.00],
    [0.30, -0.05,  0.00,  1.00],
])

BASE_MONTHLY_RETURNS = np.array([0.087 / 12, 0.030 / 12, 0.015 / 12, 0.15 / 12])
BASE_MONTHLY_VOLS = np.array([0.142 / np.sqrt(12), 0.05 / np.sqrt(12), 0.001, 0.50 / np.sqrt(12)])


def run_monte_carlo(
    portfolio: dict,
    scenario_key: str,
    adjustments: dict,
    n_paths: int = 1000,
    n_months: int = 12,
) -> dict:
    """
    Run Monte Carlo simulation for a given scenario.
    Returns p10, p50, p90 net-worth trajectories over n_months.
    """
    scenario = SCENARIOS.get(scenario_key, SCENARIOS["conservative"])
    equity_shock = scenario.get("equity_shock", 0.0)
    bond_shock = scenario.get("bond_shock", 0.0)
    vol_mult = scenario.get("vol_mult", 1.0)

    monthly_returns = BASE_MONTHLY_RETURNS.copy()
    monthly_returns[0] += equity_shock / 12
    monthly_returns[1] += bond_shock / 12

    monthly_vols = BASE_MONTHLY_VOLS * vol_mult

    # Cholesky decomposition for correlated returns
    L = np.linalg.cholesky(CORRELATION)

    base_net_worth = portfolio.get("net_worth", 342000)
    extra_monthly = adjustments.get("extra_savings", 0)

    paths = np.zeros((n_paths, n_months + 1))
    paths[:, 0] = base_net_worth

    for t in range(1, n_months + 1):
        z = np.random.randn(n_paths, 4) @ L.T
        asset_returns = monthly_returns + monthly_vols * z
        # Weighted average return (equity-heavy portfolio)
        weights = np.array([0.424, 0.035, 0.117, 0.053])
        weights /= weights.sum()
        port_return = asset_returns @ weights
        paths[:, t] = paths[:, t - 1] * (1 + port_return) + extra_monthly

    p10 = np.percentile(paths, 10, axis=0).round(0).astype(int).tolist()
    p50 = np.percentile(paths, 50, axis=0).round(0).astype(int).tolist()
    p90 = np.percentile(paths, 90, axis=0).round(0).astype(int).tolist()

    return {"p10": p10, "p50": p50, "p90": p90}
