import { useStore } from '../store'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function CashFlow() {
  const portfolio = useStore((s) => s.portfolio)

  if (!portfolio?.cashflow) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl border border-border bg-surface h-32 w-64 animate-pulse" />
      </div>
    )
  }

  const cf = portfolio.cashflow
  const expenses = cf.monthly_expenses ?? {}
  const totalExpenses = Object.values(expenses).reduce((a, b) => a + b, 0)
  const savingsRatePct = Math.round((cf.savings_rate ?? 0) * 100)
  const expenseData = Object.entries(expenses).map(([name, value]) => ({ name, value }))

  return (
    <div className="h-full overflow-y-auto bg-bg p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase">Income</p>
          <p className="text-xl font-semibold text-white">S${(cf.monthly_income ?? 0).toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase">Expenses</p>
          <p className="text-xl font-semibold text-white">S${totalExpenses.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase">Savings</p>
          <p className="text-xl font-semibold text-white">S${(cf.monthly_savings ?? 0).toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase">Savings rate</p>
          <p className="text-xl font-semibold text-white">{savingsRatePct}%</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-sm font-medium text-white mb-2">Savings rate vs 30% target</p>
        <div className="h-6 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-teal transition-all duration-500"
            style={{ width: `${Math.min(100, (savingsRatePct / 30) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-text-muted mt-1">
          <span>0%</span>
          <span className="border-l border-border pl-2">30% target</span>
          <span>100%</span>
        </div>
      </div>

      {expenseData.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm font-medium text-white mb-4">Expense breakdown</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseData} layout="vertical" margin={{ left: 60 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(v) => `S$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} width={56} />
                <Tooltip formatter={(v: number) => [`S$${v.toLocaleString()}`, '']} />
                <Bar dataKey="value" fill="#00D4AA" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
