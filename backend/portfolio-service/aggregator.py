from models import Portfolio, AssetClassBucket


def get_net_worth(portfolio: Portfolio) -> float:
    """Sum all asset values minus total liabilities."""
    # TODO: implement full net worth calculation from portfolio assets
    return portfolio.net_worth


def get_asset_class_buckets(portfolio: Portfolio) -> dict[str, AssetClassBucket]:
    """Return each asset class with its total value and percentage of total assets."""
    a = portfolio.assets
    raw = {
        "equities":    a.equities.total,
        "cpf":         a.cpf.ordinary_account + a.cpf.special_account + a.cpf.medisave,
        "real_estate": a.real_estate.equity,
        "cash":        a.cash.emergency_fund + a.cash.savings_account,
        "crypto":      a.crypto.total,
        "bonds":       a.bonds.total,
    }
    total = sum(raw.values()) or 1.0
    return {k: AssetClassBucket(total=v, pct=round(v / total, 4)) for k, v in raw.items()}


def get_liquid_assets(portfolio: Portfolio) -> float:
    """Return total liquid assets (cash + money market only)."""
    cash = portfolio.assets.cash
    return cash.emergency_fund + cash.savings_account
