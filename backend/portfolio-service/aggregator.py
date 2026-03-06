from models import Portfolio, AssetClassBucket


def get_net_worth(portfolio: Portfolio) -> float:
    """Sum all asset values minus total liabilities."""
    # TODO: implement full net worth calculation from portfolio assets
    return portfolio.net_worth


def get_asset_class_buckets(portfolio: Portfolio) -> dict[str, AssetClassBucket]:
    """Return each asset class with its total value and percentage of total assets."""
    # TODO: implement asset class bucketing
    raise NotImplementedError


def get_liquid_assets(portfolio: Portfolio) -> float:
    """Return total liquid assets (cash + money market only)."""
    cash = portfolio.assets.cash
    return cash.emergency_fund + cash.savings_account
