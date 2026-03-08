import { motion } from 'framer-motion'
import { useStore } from '../store'
import { wwsColour, HEALTH_LABEL } from '../constants/theme'
import ScoreDial from '../components/ScoreDial'
import VitalBar from '../components/VitalBar'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const VITAL_ORDER = ['diversification', 'liquidity', 'behavioral', 'growth_momentum', 'risk_reward'] as const

// ─── Animation variants ──────────────────────────────────────────────────────

const dialVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

const listVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
}

const barVariants = {
  hidden:  { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Pulse() {
  const wws              = useStore((s) => s.wws)
  const vitals           = useStore((s) => s.vitals)
  const portfolio        = useStore((s) => s.portfolio)
  const prescribedActions = useStore((s) => s.prescribedActions)

  const netWorthHistory = portfolio?.net_worth_history ?? []
  const criticalCount   = vitals
    ? Object.values(vitals).filter((v) => v.status === 'monitor' || v.status === 'critical').length
    : 0

  if (wws === null || !vitals) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl border border-border bg-surface h-32 w-64 animate-pulse" />
      </div>
    )
  }

  const accentColour = wwsColour(wws)

  return (
    <div className="h-full overflow-y-auto bg-bg p-6 space-y-6">

      {/* ── Top: Score dial (left) + Vital readings (right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* Score dial — slides up on mount */}
        <motion.div
          className="flex justify-center"
          variants={dialVariants}
          initial="hidden"
          animate="visible"
        >
          <ScoreDial score={wws} label={HEALTH_LABEL(wws)} />
        </motion.div>

        {/* Vital readings list — staggered entrance */}
        <motion.div
          className="space-y-4"
          variants={listVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Attention banner */}
          {criticalCount > 0 && (
            <motion.div
              variants={barVariants}
              className="rounded-lg border px-4 py-2.5 text-sm font-medium"
              style={{
                borderColor:     accentColour,
                backgroundColor: `${accentColour}15`,
                color:           accentColour,
              }}
            >
              {criticalCount} vital{criticalCount !== 1 ? 's' : ''} require{criticalCount === 1 ? 's' : ''} attention
            </motion.div>
          )}

          {/* Vital bars */}
          {VITAL_ORDER.map((key) => {
            const v = vitals[key]
            if (!v) return null
            return (
              <motion.div key={key} variants={barVariants}>
                <VitalBar
                  label={v.label}
                  score={v.score}
                  weight={v.weight}
                  status={v.status}
                />
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      {/* ── Net worth sparkline ── */}
      {netWorthHistory.length > 0 && (
        <motion.div
          className="rounded-xl border border-border bg-surface p-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6, ease: 'easeOut' }}
        >
          <p className="text-sm font-medium text-white mb-3">Net worth trend</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netWorthHistory} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
                <defs>
                  <linearGradient id="nwGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#00D4AA" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#00D4AA" stopOpacity={0}    />
                  </linearGradient>
                </defs>
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
                  contentStyle={{ backgroundColor: '#0F1623', border: '1px solid #1E293B', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`S$${v.toLocaleString()}`, 'Net worth']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#00D4AA"
                  strokeWidth={2}
                  fill="url(#nwGradient)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* ── Prescribed actions ── */}
      {prescribedActions.length > 0 && (
        <motion.div
          className="rounded-xl border border-border bg-surface p-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.75, ease: 'easeOut' }}
        >
          <p className="text-sm font-medium text-white mb-3">Prescribed actions</p>
          <ul className="space-y-2">
            {prescribedActions.map((action, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-text-muted leading-snug">
                <span className="font-bold italic flex-shrink-0" style={{ color: '#00D4AA' }}>Rx</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  )
}
