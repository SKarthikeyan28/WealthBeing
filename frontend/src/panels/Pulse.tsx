import { useStore } from '../store'
import { wwsColour, HEALTH_LABEL } from '../constants/theme'
import ScoreDial from '../components/ScoreDial'
import VitalBar from '../components/VitalBar'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const VITAL_ORDER = ['diversification', 'liquidity', 'behavioral', 'growth_momentum', 'risk_reward'] as const

export default function Pulse() {
  const wws = useStore((s) => s.wws)
  const vitals = useStore((s) => s.vitals)
  const portfolio = useStore((s) => s.portfolio)
  const prescribedActions = useStore((s) => s.prescribedActions)

  const netWorthHistory = portfolio?.net_worth_history ?? []
  const criticalCount = vitals ? Object.values(vitals).filter((v) => v.status === 'monitor' || v.status === 'critical').length : 0

  if (wws === null || !vitals) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl border border-border bg-surface h-32 w-64 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-bg p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex justify-center">
          <ScoreDial score={wws} label={HEALTH_LABEL(wws)} />
        </div>
        <div className="space-y-4">
          {criticalCount > 0 && (
            <div
              className="rounded-lg border px-4 py-2 text-sm"
              style={{ borderColor: wwsColour(wws), backgroundColor: `${wwsColour(wws)}15` }}
            >
              {criticalCount} vital{criticalCount !== 1 ? 's' : ''} require attention
            </div>
          )}
          {VITAL_ORDER.map((key) => {
            const v = vitals[key]
            if (!v) return null
            return (
              <VitalBar
                key={key}
                label={v.label}
                score={v.score}
                weight={v.weight}
                status={v.status}
              />
            )
          })}
        </div>
      </div>

      {netWorthHistory.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm font-medium text-white mb-3">Net worth trend</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netWorthHistory} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <defs>
                  <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00D4AA" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#00D4AA" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(v) => `S$${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v: number) => [`S$${v.toLocaleString()}`, 'Net worth']} />
                <Area type="monotone" dataKey="value" stroke="#00D4AA" fill="url(#netWorthGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {prescribedActions.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm font-medium text-white mb-2">Prescribed actions</p>
          <ul className="space-y-1.5">
            {prescribedActions.map((action, i) => (
              <li key={i} className="flex gap-2 text-sm text-text-muted">
                <span className="font-bold text-teal">Rx</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
