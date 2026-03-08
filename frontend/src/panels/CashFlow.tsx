import { useStore } from '../store'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts'

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#0F1623', border: '1px solid #1E293B', borderRadius: 8, fontSize: 12 },
  labelStyle:   { color: '#94A3B8' },
}

export default function CashFlow() {
  const portfolio = useStore((s) => s.portfolio)

  if (!portfolio?.cashflow) {
    return (
      <div className="h-full overflow-y-auto bg-bg p-6 space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-4 space-y-2">
              <div className="h-2 rounded bg-border animate-pulse w-16" />
              <div className="h-6 rounded bg-border animate-pulse w-20" />
            </div>
          ))}
        </div>
        {/* Savings gauge */}
        <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <div className="h-2 rounded bg-border animate-pulse w-24" />
          <div className="h-3 rounded-full bg-border animate-pulse w-full" />
        </div>
        {/* Expense chart */}
        <div className="rounded-xl border border-border bg-surface h-64 animate-pulse" />
        {/* Trend chart */}
        <div className="rounded-xl border border-border bg-surface h-44 animate-pulse" />
      </div>
    )
  }

  const cf            = portfolio.cashflow
  const expenses      = cf.monthly_expenses ?? {}
  const totalExpenses = Object.values(expenses).reduce((a, b) => a + b, 0)
  const savingsRatePct = Math.round((cf.savings_rate ?? 0) * 100)
  const expenseData   = Object.entries(expenses).map(([name, value]) => ({ name, value }))

  // ── Monthly savings trend — last 3 months derived from net worth history ──
  // Take the last 4 snapshots and compute month-over-month deltas (3 data points).
  const history = portfolio.net_worth_history ?? []
  const last4   = history.slice(-4)
  const savingsTrend = last4.length >= 2
    ? last4.slice(1).map((item, i) => ({
        month:   item.month,
        savings: item.value - last4[i].value,
      }))
    : []

  return (
    <div className="h-full overflow-y-auto bg-bg p-6 space-y-6">

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Income',       value: `S$${(cf.monthly_income ?? 0).toLocaleString()}` },
          { label: 'Expenses',     value: `S$${totalExpenses.toLocaleString()}` },
          { label: 'Savings',      value: `S$${(cf.monthly_savings ?? 0).toLocaleString()}` },
          { label: 'Savings rate', value: `${savingsRatePct}%` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs text-text-muted uppercase tracking-widest">{label}</p>
            <p className="text-xl font-semibold text-white mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Savings rate gauge with dashed 30% target marker ── */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-white">Savings rate</p>
          <span className="text-xs text-text-muted">Target: 30%</span>
        </div>
        {/* The bar spans 0 → 100% of available width, representing 0 → 40% savings rate.
            The dashed marker sits at 30/40 = 75% of the bar width. */}
        <div className="relative h-3 rounded-full bg-border overflow-visible">
          {/* Fill */}
          <div
            className="h-full rounded-full bg-teal transition-all duration-700"
            style={{ width: `${Math.min(100, (savingsRatePct / 40) * 100)}%` }}
          />
          {/* 30% target dashed marker */}
          <div
            className="absolute top-0 h-full border-l-2 border-dashed border-amber"
            style={{ left: '75%' }}
            aria-label="30% target"
          />
        </div>
        <div className="flex justify-between text-xs text-text-muted mt-1.5">
          <span>0%</span>
          <span className="text-amber" style={{ marginLeft: '72%' }}>30%</span>
          <span>40%+</span>
        </div>
      </div>

      {/* ── Expense breakdown ── */}
      {expenseData.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm font-medium text-white mb-4">Expense breakdown</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  tickFormatter={(v: number) => `S$${v}`}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  width={72}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  {...TOOLTIP_STYLE}
                  formatter={(v: number) => [`S$${v.toLocaleString()}`, '']}
                />
                <Bar dataKey="value" fill="#00D4AA" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Monthly net savings trend (last 3 months) ── */}
      {savingsTrend.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm font-medium text-white mb-4">
            Net savings trend
            <span className="text-xs font-normal text-text-muted ml-2">(last 3 months)</span>
          </p>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={savingsTrend} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  tickFormatter={(v: number) => `S$${Math.round(v / 1000)}k`}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip
                  {...TOOLTIP_STYLE}
                  formatter={(v: number) => [`S$${v.toLocaleString()}`, 'Net change']}
                />
                <Line
                  type="monotone"
                  dataKey="savings"
                  stroke="#00D4AA"
                  strokeWidth={2}
                  dot={{ fill: '#00D4AA', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
