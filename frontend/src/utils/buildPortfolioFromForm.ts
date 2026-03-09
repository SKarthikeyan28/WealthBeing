import type { Portfolio } from '../store'

export interface FinancialHealthFormValues {
  name: string
  age: number
  location: string

  monthly_income: number
  monthly_expenses_total: number

  emergency_fund: number
  savings_account: number

  equities_total: number
  cpf_total: number
  real_estate_equity: number
  crypto_total: number
  bonds_total: number

  top_holding_pct: number

  mortgage_outstanding: number
  credit_card_outstanding: number

  yoy_net_worth_growth?: number
  panic_sells?: number
  reactive_trades?: number
}

const DEFAULT_EXPENSE_CATEGORIES: Record<string, number> = {
  housing: 0,
  food: 0,
  transport: 0,
  insurance: 0,
  entertainment: 0,
  utilities: 0,
  other: 0,
}

function buildMonthlyExpenses(total: number): Record<string, number> {
  if (total <= 0) return { ...DEFAULT_EXPENSE_CATEGORIES }
  return {
    housing: Math.round(total * 0.35),
    food: Math.round(total * 0.2),
    transport: Math.round(total * 0.1),
    insurance: Math.round(total * 0.1),
    entertainment: Math.round(total * 0.1),
    utilities: Math.round(total * 0.05),
    other: Math.round(total * 0.1),
  }
}

function buildTransactions(panicSells: number, reactiveTrades: number): unknown[] {
  const list: unknown[] = []
  for (let i = 0; i < (panicSells || 0); i++) {
    list.push({
      date: new Date().toISOString().slice(0, 10),
      type: 'panic_sell',
      ticker: 'STOCK',
      value: 0,
      reactive: true,
      note: 'User-reported',
    })
  }
  for (let i = 0; i < (reactiveTrades || 0); i++) {
    list.push({
      date: new Date().toISOString().slice(0, 10),
      type: 'buy',
      ticker: 'STOCK',
      value: 0,
      reactive: true,
      note: 'User-reported',
    })
  }
  return list
}

function buildNetWorthHistory(netWorth: number, numMonths = 7): { month: string; value: number }[] {
  const now = new Date()
  const points: { month: string; value: number }[] = []
  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthLabel = d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    const pct = 1 - (0.1 * (numMonths - 1 - i)) / numMonths
    points.push({ month: monthLabel, value: Math.round(netWorth * pct) })
  }
  return points
}

export function buildPortfolioFromForm(values: FinancialHealthFormValues): Portfolio {
  const expensesTotal = Math.max(0, values.monthly_expenses_total)
  const income = Math.max(0, values.monthly_income)
  const monthlyExpenses = buildMonthlyExpenses(expensesTotal)
  const monthlySavings = Math.max(0, income - expensesTotal)
  const savingsRate = income > 0 ? monthlySavings / income : 0

  const emergencyFund = Math.max(0, values.emergency_fund)
  const savingsAccount = Math.max(0, values.savings_account)
  const equities = Math.max(0, values.equities_total)
  const cpf = Math.max(0, values.cpf_total)
  const realEstateEquity = Math.max(0, values.real_estate_equity)
  const crypto = Math.max(0, values.crypto_total)
  const bonds = Math.max(0, values.bonds_total)
  const cashTotal = emergencyFund + savingsAccount

  const mortgage = Math.max(0, values.mortgage_outstanding)
  const creditCard = Math.max(0, values.credit_card_outstanding)

  const totalAssets = equities + cpf + realEstateEquity + cashTotal + crypto + bonds
  const totalLiabilities = mortgage + creditCard
  const netWorth = Math.max(0, totalAssets - totalLiabilities)

  const totalForAllocation = totalAssets || 1
  const asset_class_allocations = {
    equities: equities / totalForAllocation,
    cpf: cpf / totalForAllocation,
    real_estate: realEstateEquity / totalForAllocation,
    cash: cashTotal / totalForAllocation,
    crypto: crypto / totalForAllocation,
    bonds: bonds / totalForAllocation,
  }

  const topHoldingPct = Math.min(1, Math.max(0, (values.top_holding_pct ?? 0) / 100))
  const yoyGrowth = values.yoy_net_worth_growth ?? 0.05
  const transactions = buildTransactions(values.panic_sells ?? 0, values.reactive_trades ?? 0)

  const portfolio: Portfolio = {
    patient: {
      name: values.name.trim() || 'User',
      age: Math.max(18, Math.min(120, values.age)),
      location: values.location.trim() || 'Singapore',
    },
    net_worth: netWorth,
    net_worth_history: buildNetWorthHistory(netWorth),
    assets: {
      equities: {
        total: equities,
        holdings: equities > 0
          ? [{ ticker: 'Equity', name: 'Stocks', value: equities, pct_of_equity: topHoldingPct }]
          : [],
      },
      cpf: { ordinary_account: Math.round(cpf * 0.6), special_account: Math.round(cpf * 0.3), medisave: Math.round(cpf * 0.1) },
      cash: { emergency_fund: emergencyFund, savings_account: savingsAccount },
      real_estate: { type: 'Property', current_value: realEstateEquity + mortgage, outstanding_loan: mortgage, equity: realEstateEquity },
      crypto: { total: crypto, holdings: crypto > 0 ? [{ coin: 'CRYPTO', value: crypto }] : [] },
      bonds: { total: bonds, holdings: bonds > 0 ? [{ name: 'Bonds', value: bonds }] : [] },
    },
    liabilities: {
      hdb_mortgage: { outstanding: mortgage, monthly_payment: 0, rate: 0.026, years_remaining: 20 },
      credit_card: { outstanding: creditCard, limit: 15000 },
    },
    cashflow: {
      monthly_income: income,
      monthly_expenses: monthlyExpenses,
      monthly_savings: monthlySavings,
      savings_rate: savingsRate,
    },
    transactions,
    goals: [],
    scoring_inputs: {
      asset_class_allocations,
      top_holding_pct: topHoldingPct,
      expected_annual_return: 0.07,
      portfolio_volatility: 0.15,
      yoy_net_worth_growth: yoyGrowth,
    },
  }

  return portfolio
}

export const defaultFormValues: FinancialHealthFormValues = {
  name: '',
  age: 32,
  location: 'Singapore',
  monthly_income: 8500,
  monthly_expenses_total: 4100,
  emergency_fund: 25200,
  savings_account: 14800,
  equities_total: 145000,
  cpf_total: 117000,
  real_estate_equity: 170000,
  crypto_total: 18000,
  bonds_total: 12000,
  top_holding_pct: 38,
  mortgage_outstanding: 410000,
  credit_card_outstanding: 2400,
  yoy_net_worth_growth: 0.05,
  panic_sells: 0,
  reactive_trades: 0,
}
