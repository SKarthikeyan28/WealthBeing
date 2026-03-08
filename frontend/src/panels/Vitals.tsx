import { useStore } from '../store'
import StatusBadge from '../components/StatusBadge'
import type { Status } from '../constants/theme'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts'

const VITAL_ORDER = ['diversification', 'liquidity', 'behavioral', 'growth_momentum', 'risk_reward'] as const

export default function Vitals() {
  const vitals = useStore((s) => s.vitals)
  const portfolio = useStore((s) => s.portfolio)

  if (!vitals) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl border border-border bg-surface h-48 w-64 animate-pulse" />
      </div>
    )
  }

  const radarData = VITAL_ORDER.map((key) => {
    const v = vitals[key]
    return { pillar: v?.label ?? key, score: v?.score ?? 0, fullMark: 100 }
  })

  const cashflow = portfolio?.cashflow
  const expenses = cashflow?.monthly_expenses ? Object.values(cashflow.monthly_expenses).reduce((a, b) => a + b, 0) : 0
  const emergencyFund = (portfolio?.assets as { cash?: { emergency_fund?: number } })?.cash?.emergency_fund ?? 0
  const monthsEF = expenses > 0 ? Math.round((emergencyFund / expenses) * 10) / 10 : 0
  const savingsRatePct = cashflow ? Math.round(cashflow.savings_rate * 100) : 0
  const equities = portfolio?.assets as { equities?: { holdings?: { ticker: string; pct_of_equity: number }[] } } | undefined
  const topHolding = equities?.equities?.holdings?.[0]
  const topPct = topHolding ? Math.round((topHolding.pct_of_equity ?? 0) * 100) : 0
  const si = portfolio?.scoring_inputs as { yoy_net_worth_growth?: number } | undefined
  const yoyGrowth = si?.yoy_net_worth_growth != null ? (si.yoy_net_worth_growth * 100).toFixed(1) : '—'

  const metrics: { label: string; value: string; status: Status }[] = [
    { label: 'Emergency fund', value: `${monthsEF} months`, status: monthsEF >= 6 ? 'healthy' : monthsEF >= 4 ? 'monitor' : 'critical' },
    { label: 'Savings rate', value: `${savingsRatePct}%`, status: savingsRatePct >= 30 ? 'healthy' : savingsRatePct >= 20 ? 'monitor' : 'critical' },
    { label: 'Concentration (top holding)', value: topHolding ? `${topPct}% ${topHolding.ticker}` : '—', status: topPct <= 35 ? 'healthy' : topPct <= 40 ? 'monitor' : 'critical' },
    { label: 'Diversification', value: `${vitals.diversification?.score ?? 0}/100`, status: (vitals.diversification?.status as Status) ?? 'healthy' },
    { label: 'Behavioural resilience', value: `${vitals.behavioral?.score ?? 0}/100`, status: (vitals.behavioral?.status as Status) ?? 'healthy' },
    { label: 'Net worth growth YoY', value: `+${yoyGrowth}%`, status: 'healthy' },
  ]

  return (
    <div className="h-full overflow-y-auto bg-bg p-6 space-y-6">
      <div className="rounded-xl border border-border bg-surface p-4 h-72">
        <p className="text-sm font-medium text-white mb-2">Pillar scores</p>
        <ResponsiveContainer width="100%" height="90%">
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="pillar" tick={{ fontSize: 10, fill: '#94A3B8' }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94A3B8' }} />
            <Radar name="You" dataKey="score" stroke="#00D4AA" fill="#00D4AA" fillOpacity={0.3} strokeWidth={2} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs text-text-muted uppercase tracking-widest">{m.label}</p>
            <p className="text-lg font-semibold text-white mt-0.5">{m.value}</p>
            <StatusBadge status={m.status} />
          </div>
        ))}
      </div>
    </div>
  )
}
