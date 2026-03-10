import type { Portfolio } from '../store'

export interface FinancialHealthFormValues {
  name: string
  age: number

  monthly_income: number
  expense_housing: number
  expense_food: number
  expense_transport: number
  expense_insurance: number
  expense_entertainment: number
  expense_utilities: number
  expense_other: number

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

  emergency_months_target?: number
  savings_rate_target_pct?: number

  yoy_net_worth_growth?: number
  panic_sells?: number
  reactive_trades?: number
}

function buildMonthlyExpensesFromCategories(values: FinancialHealthFormValues): Record<string, number> {
  return {
    housing: Math.max(0, values.expense_housing),
    food: Math.max(0, values.expense_food),
    transport: Math.max(0, values.expense_transport),
    insurance: Math.max(0, values.expense_insurance),
    entertainment: Math.max(0, values.expense_entertainment),
    utilities: Math.max(0, values.expense_utilities),
    other: Math.max(0, values.expense_other),
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
  const monthlyExpenses = buildMonthlyExpensesFromCategories(values)
  const expensesTotal = Object.values(monthlyExpenses).reduce((a, b) => a + b, 0)
  const income = Math.max(0, values.monthly_income)
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
      location: 'Singapore',
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
    user_preferences: {
      emergency_months_target: Math.max(1, Math.min(24, values.emergency_months_target ?? 6)),
      savings_rate_target_pct: Math.max(5, Math.min(80, values.savings_rate_target_pct ?? 30)),
    },
  }

  return portfolio
}

export const defaultFormValues: FinancialHealthFormValues = {
  name: '',
  age: 32,
  monthly_income: 8500,
  expense_housing: 1800,
  expense_food: 800,
  expense_transport: 300,
  expense_insurance: 350,
  expense_entertainment: 400,
  expense_utilities: 150,
  expense_other: 300,
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
  emergency_months_target: 6,
  savings_rate_target_pct: 30,
}

/** Map a saved portfolio back to form values for prefill. */
export function portfolioToFormValues(portfolio: Portfolio): FinancialHealthFormValues {
  const patient = portfolio.patient || {}
  const cashflow = portfolio.cashflow || {}
  const expenses = (cashflow.monthly_expenses || {}) as Record<string, number>
  const assets = (portfolio.assets || {}) as Record<string, unknown>
  const liabilities = (portfolio.liabilities || {}) as Record<string, unknown>
  const scoringInputs = (portfolio.scoring_inputs || {}) as Record<string, unknown>
  const prefs = portfolio.user_preferences || {}

  const cash = (assets.cash || {}) as { emergency_fund?: number; savings_account?: number }
  const equities = (assets.equities || {}) as { total?: number; holdings?: { pct_of_equity?: number }[] }
  const cpf = (assets.cpf || {}) as { ordinary_account?: number; special_account?: number; medisave?: number }
  const realEstate = (assets.real_estate || {}) as { equity?: number }
  const crypto = (assets.crypto || {}) as { total?: number }
  const bonds = (assets.bonds || {}) as { total?: number }
  const mortgage = (liabilities.hdb_mortgage || {}) as { outstanding?: number }
  const creditCard = (liabilities.credit_card || {}) as { outstanding?: number }

  const cpfTotal = [cpf.ordinary_account, cpf.special_account, cpf.medisave].reduce((a: number, b) => a + (b ?? 0), 0)
  const topHolding = equities.holdings?.[0]
  const topPct = topHolding != null && typeof topHolding.pct_of_equity === 'number'
    ? Math.round(topHolding.pct_of_equity * 100)
    : 38

  const transactions = (portfolio.transactions || []) as { type?: string; reactive?: boolean }[]
  const panicSells = transactions.filter((t) => t.type === 'panic_sell').length
  const reactiveTrades = transactions.filter((t) => t.reactive === true).length

  return {
    name: typeof patient.name === 'string' ? patient.name : '',
    age: typeof patient.age === 'number' ? patient.age : 32,
    monthly_income: typeof cashflow.monthly_income === 'number' ? cashflow.monthly_income : 8500,
    expense_housing: typeof expenses.housing === 'number' ? expenses.housing : 0,
    expense_food: typeof expenses.food === 'number' ? expenses.food : 0,
    expense_transport: typeof expenses.transport === 'number' ? expenses.transport : 0,
    expense_insurance: typeof expenses.insurance === 'number' ? expenses.insurance : 0,
    expense_entertainment: typeof expenses.entertainment === 'number' ? expenses.entertainment : 0,
    expense_utilities: typeof expenses.utilities === 'number' ? expenses.utilities : 0,
    expense_other: typeof expenses.other === 'number' ? expenses.other : 0,
    emergency_fund: typeof cash.emergency_fund === 'number' ? cash.emergency_fund : 0,
    savings_account: typeof cash.savings_account === 'number' ? cash.savings_account : 0,
    equities_total: typeof equities.total === 'number' ? equities.total : 0,
    cpf_total: cpfTotal,
    real_estate_equity: typeof realEstate.equity === 'number' ? realEstate.equity : 0,
    crypto_total: typeof crypto.total === 'number' ? crypto.total : 0,
    bonds_total: typeof bonds.total === 'number' ? bonds.total : 0,
    top_holding_pct: topPct,
    mortgage_outstanding: typeof mortgage.outstanding === 'number' ? mortgage.outstanding : 0,
    credit_card_outstanding: typeof creditCard.outstanding === 'number' ? creditCard.outstanding : 0,
    emergency_months_target: typeof prefs.emergency_months_target === 'number' ? prefs.emergency_months_target : 6,
    savings_rate_target_pct: typeof prefs.savings_rate_target_pct === 'number' ? prefs.savings_rate_target_pct : 30,
    yoy_net_worth_growth: typeof scoringInputs.yoy_net_worth_growth === 'number' ? scoringInputs.yoy_net_worth_growth : 0.05,
    panic_sells: panicSells,
    reactive_trades: reactiveTrades,
  }
}
