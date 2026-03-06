from pydantic import BaseModel
from typing import Optional


class Patient(BaseModel):
    name: str
    age: int
    location: str


class EquityHolding(BaseModel):
    ticker: str
    name: str
    value: float
    pct_of_equity: float


class Equities(BaseModel):
    total: float
    holdings: list[EquityHolding]


class CPF(BaseModel):
    ordinary_account: float
    special_account: float
    medisave: float


class Cash(BaseModel):
    emergency_fund: float
    savings_account: float


class CryptoHolding(BaseModel):
    coin: str
    value: float


class Crypto(BaseModel):
    total: float
    holdings: list[CryptoHolding]


class RealEstate(BaseModel):
    type: str
    current_value: float
    outstanding_loan: float
    equity: float


class BondHolding(BaseModel):
    name: str
    value: float


class Bonds(BaseModel):
    total: float
    holdings: list[BondHolding]


class Assets(BaseModel):
    equities: Equities
    cpf: CPF
    cash: Cash
    crypto: Crypto
    real_estate: RealEstate
    bonds: Bonds


class Mortgage(BaseModel):
    outstanding: float
    monthly_payment: float
    rate: float
    years_remaining: int


class CreditCard(BaseModel):
    outstanding: float
    limit: float


class Liabilities(BaseModel):
    hdb_mortgage: Mortgage
    credit_card: CreditCard


class MonthlyExpenses(BaseModel):
    housing: float
    food: float
    transport: float
    insurance: float
    entertainment: float
    utilities: float
    other: float


class CashFlow(BaseModel):
    monthly_income: float
    monthly_expenses: MonthlyExpenses
    monthly_savings: float
    savings_rate: float


class Transaction(BaseModel):
    date: str
    type: str
    ticker: str
    value: float
    reactive: bool
    note: str


class Goal(BaseModel):
    id: str
    name: str
    target: float
    current: float
    deadline: str


class ScoringInputs(BaseModel):
    asset_class_allocations: dict[str, float]
    top_holding_pct: float
    expected_annual_return: float
    portfolio_volatility: float
    yoy_net_worth_growth: float


class NetWorthSnapshot(BaseModel):
    month: str
    value: float


class Portfolio(BaseModel):
    patient: Patient
    net_worth: float
    net_worth_history: list[NetWorthSnapshot]
    assets: Assets
    liabilities: Liabilities
    cashflow: CashFlow
    transactions: list[Transaction]
    goals: list[Goal]
    scoring_inputs: ScoringInputs


class AssetClassBucket(BaseModel):
    total: float
    pct: float
