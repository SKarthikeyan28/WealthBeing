import { motion } from 'framer-motion'
import { useStore } from '../store'
import { colours } from '../constants/theme'
import StatusBadge from '../components/StatusBadge'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'

// ─── Asset class colour map ───────────────────────────────────────────────────

const ASSET_COLOURS: Record<string, string> = {
  Equities:            colours.teal,
  CPF:                 colours.purple,
  'Real Estate Equity': colours.amber,
  Cash:                colours.tealMuted,
  Crypto:              colours.orange,
  Bonds:               '#60A5FA',
}

function assetColour(name: string): string {
  return ASSET_COLOURS[name] ?? colours.textMuted
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) => `S$${n.toLocaleString()}`

// ─── Sub-types for asset casts ────────────────────────────────────────────────

interface EquitiesAsset {
  total?: number
  holdings?: { ticker: string; name: string; value: number; pct_of_equity: number }[]
}

interface CpfAsset {
  ordinary_account?: number
  special_account?: number
  medisave?: number
}

interface CashAsset {
  emergency_fund?: number
  savings_account?: number
}

interface SimpleAsset { total?: number }

interface RealEstateAsset {
  type?: string
  current_value?: number
  outstanding_loan?: number
  equity?: number
}

interface HdbMortgage {
  outstanding?:    number
  monthly_payment?: number
  rate?:           number
  years_remaining?: number
}

interface CreditCard {
  outstanding?: number
  limit?:       number
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function FinancialAnatomy() {
  const portfolio = useStore((s) => s.portfolio)

  if (!portfolio) {
    return (
      <div className="h-full overflow-y-auto bg-bg p-6 space-y-8">
        {/* Asset chart + cards */}
        <div className="space-y-4">
          <div className="h-3 rounded bg-surface animate-pulse w-28" />
          <div className="rounded-xl border border-border bg-surface h-52 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-3 h-14 animate-pulse" />
            ))}
          </div>
        </div>
        {/* Liabilities */}
        <div className="space-y-3">
          <div className="h-3 rounded bg-surface animate-pulse w-40" />
          <div className="rounded-xl border border-border bg-surface h-28 animate-pulse" />
          <div className="rounded-xl border border-border bg-surface h-16 animate-pulse" />
        </div>
        {/* Goals */}
        <div className="space-y-3">
          <div className="h-3 rounded bg-surface animate-pulse w-36" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface h-20 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // ── Asset data ──────────────────────────────────────────────────────────────
  const rawAssets = portfolio.assets as Record<string, unknown>

  const equities   = rawAssets.equities    as EquitiesAsset    | undefined
  const cpf        = rawAssets.cpf         as CpfAsset         | undefined
  const realEstate = rawAssets.real_estate as RealEstateAsset  | undefined
  const cashAsset  = rawAssets.cash        as CashAsset        | undefined
  const crypto     = rawAssets.crypto      as SimpleAsset      | undefined
  const bonds      = rawAssets.bonds       as SimpleAsset      | undefined

  const cpfTotal   = (cpf?.ordinary_account ?? 0) + (cpf?.special_account ?? 0) + (cpf?.medisave ?? 0)
  const cashTotal  = (cashAsset?.emergency_fund ?? 0) + (cashAsset?.savings_account ?? 0)

  const assetItems: { name: string; value: number }[] = [
    { name: 'Equities',            value: equities?.total     ?? 0 },
    { name: 'CPF',                 value: cpfTotal                 },
    { name: 'Real Estate Equity',  value: realEstate?.equity  ?? 0 },
    { name: 'Cash',                value: cashTotal                },
    { name: 'Crypto',              value: crypto?.total       ?? 0 },
    { name: 'Bonds',               value: bonds?.total        ?? 0 },
  ].filter((i) => i.value > 0)

  const totalAssets = assetItems.reduce((s, i) => s + i.value, 0)

  const chartData = assetItems.map((i) => ({
    name:  i.name,
    value: i.value,
    pct:   totalAssets > 0 ? Math.round((i.value / totalAssets) * 100) : 0,
  }))

  // ── Equity holdings ─────────────────────────────────────────────────────────
  const holdings = equities?.holdings ?? []

  // ── Liabilities ─────────────────────────────────────────────────────────────
  const rawLiabilities = portfolio.liabilities as Record<string, unknown>
  const mortgage   = rawLiabilities.hdb_mortgage as HdbMortgage  | undefined
  const creditCard = rawLiabilities.credit_card  as CreditCard   | undefined

  const mortgageOutstanding = mortgage?.outstanding    ?? 0
  const ccOutstanding       = creditCard?.outstanding  ?? 0
  const totalLiabilities    = mortgageOutstanding + ccOutstanding
  const grossAssets         = (portfolio.net_worth ?? 0) + totalLiabilities
  const debtToAssetPct      = grossAssets > 0
    ? Math.round((totalLiabilities / grossAssets) * 100)
    : 0
  const debtStatus =
    debtToAssetPct < 30 ? 'healthy' : debtToAssetPct < 50 ? 'monitor' : 'critical'

  // ── Goals ───────────────────────────────────────────────────────────────────
  const goals = portfolio.goals ?? []

  return (
    <div className="h-full overflow-y-auto bg-bg p-6 space-y-8">

      {/* ── Section 1: Asset Breakdown ─────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-white mb-4">Asset Breakdown</h2>

        {/* Horizontal bar chart */}
        <div className="rounded-xl border border-border bg-surface p-4 mb-4">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 0, right: 48, top: 4, bottom: 4 }}
              >
                <XAxis
                  type="number"
                  hide
                  domain={[0, totalAssets * 1.05]}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: colours.textMuted }}
                  width={130}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: colours.surface,
                    border: `1px solid ${colours.border}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number, _name, props) => [
                    `${fmt(value)} (${(props.payload as { pct: number }).pct}%)`,
                    '',
                  ]}
                  labelStyle={{ color: colours.textMuted }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} label={{
                  position: 'right',
                  formatter: (_v: unknown, entry: { pct?: number }) =>
                    entry?.pct !== undefined ? `${entry.pct}%` : '',
                  fontSize: 11,
                  fill: colours.textMuted,
                }}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={assetColour(entry.name)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset class summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {assetItems.map((item) => (
            <div
              key={item.name}
              className="rounded-xl border border-border bg-surface p-3 flex items-center gap-3"
            >
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: assetColour(item.name) }}
              />
              <div className="min-w-0">
                <p className="text-[10px] text-text-muted truncate">{item.name}</p>
                <p className="text-sm font-semibold text-white">
                  {fmt(item.value)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 2: Equity Holdings Table ──────────────────────────────── */}
      {holdings.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-white mb-4">Equity Holdings</h2>
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted">Ticker</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted">Name</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted">Value</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted">% Equity</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {holdings.map((h, i) => {
                  const pct        = Math.round((h.pct_of_equity ?? 0) * 100)
                  const isConcentrated = pct > 35
                  return (
                    <tr
                      key={h.ticker}
                      className={`border-b border-border last:border-0 transition-colors ${
                        isConcentrated ? 'bg-amber/5' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold" style={{ color: colours.teal }}>
                        {h.ticker}
                      </td>
                      <td className="px-4 py-3 text-white">{h.name}</td>
                      <td className="px-4 py-3 text-right text-white tabular-nums">
                        {fmt(h.value)}
                      </td>
                      <td
                        className="px-4 py-3 text-right font-semibold tabular-nums"
                        style={{ color: isConcentrated ? colours.amber : colours.textMuted }}
                      >
                        {pct}%
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isConcentrated ? (
                          <StatusBadge status="monitor" />
                        ) : i === 0 ? (
                          <StatusBadge status="healthy" />
                        ) : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-text-muted mt-2 pl-1">
            Flag: any single holding above 35% of equity portfolio
          </p>
        </section>
      )}

      {/* ── Section 3: Liabilities & Debt Health ──────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-white mb-4">Liabilities &amp; Debt Health</h2>

        <div className="space-y-3">
          {/* HDB Mortgage detail card */}
          {mortgage && mortgageOutstanding > 0 && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">
                    HDB Mortgage
                  </p>
                  <p className="text-xl font-semibold text-white">
                    {fmt(mortgageOutstanding)}
                  </p>
                </div>
                <StatusBadge status="monitor" />
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                {[
                  { label: 'Monthly',       value: `${fmt(mortgage.monthly_payment ?? 0)}` },
                  { label: 'Rate',          value: `${((mortgage.rate ?? 0) * 100).toFixed(1)}%` },
                  { label: 'Remaining',     value: `${mortgage.years_remaining ?? 0} yrs` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] text-text-muted">{label}</p>
                    <p className="text-sm font-medium text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Credit card */}
          {ccOutstanding > 0 && (
            <div className="rounded-xl border border-border bg-surface p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-widest">Credit Card</p>
                <p className="text-lg font-semibold text-white mt-0.5">{fmt(ccOutstanding)}</p>
              </div>
              {creditCard?.limit && (
                <p className="text-xs text-text-muted">
                  Limit: {fmt(creditCard.limit)}
                </p>
              )}
            </div>
          )}

          {/* Debt-to-asset health bar */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-widest">Debt-to-Asset Ratio</p>
                <p className="text-xl font-semibold text-white mt-0.5">{debtToAssetPct}%</p>
              </div>
              <StatusBadge status={debtStatus} />
            </div>

            {/* Bar: range 0–80%, threshold marker at 30% (= 37.5% of bar width) */}
            <div className="relative h-3 rounded-full bg-border overflow-visible">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: colours[debtStatus === 'healthy' ? 'teal' : debtStatus === 'monitor' ? 'amber' : 'red'] }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (debtToAssetPct / 80) * 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
              {/* 30% threshold dashed marker */}
              <div
                className="absolute top-[-4px] h-[calc(100%+8px)] border-l-2 border-dashed border-amber"
                style={{ left: '37.5%' }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-text-muted mt-1.5">
              <span>0%</span>
              <span style={{ marginLeft: '34%', color: colours.amber }}>30% threshold</span>
              <span>80%</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: Recovery Milestones (Goals) ────────────────────────── */}
      {goals.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-white mb-4">Recovery Milestones</h2>
          <div className="space-y-3">
            {goals.map((g) => {
              const pct      = Math.min(100, Math.round((g.current / g.target) * 100))
              const goalStatus =
                pct >= 75 ? 'healthy' : pct >= 40 ? 'monitor' : 'critical'
              const barColour =
                goalStatus === 'healthy' ? colours.teal
                : goalStatus === 'monitor' ? colours.amber
                : colours.red
              const deadline = new Date(g.deadline).toLocaleDateString('en-SG', {
                month: 'short', year: 'numeric',
              })

              return (
                <div key={g.id} className="rounded-xl border border-border bg-surface p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{g.name}</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        Target by {deadline}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold" style={{ color: barColour }}>
                        {pct}%
                      </p>
                      <p className="text-[10px] text-text-muted">
                        {fmt(g.current)} / {fmt(g.target)}
                      </p>
                    </div>
                  </div>

                  {/* Animated progress bar */}
                  <div className="h-2 rounded-full bg-border overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: barColour }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, ease: 'easeOut' }}
                    />
                  </div>

                  {/* Remaining */}
                  {g.current < g.target && (
                    <p className="text-[10px] text-text-muted mt-2">
                      {fmt(g.target - g.current)} remaining
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
