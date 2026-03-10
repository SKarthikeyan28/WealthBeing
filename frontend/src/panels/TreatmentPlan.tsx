import { useState, useMemo } from 'react'
import { useStore } from '../store'
import { colours } from '../constants/theme'
import { useSandbox, useMonteCarlo, type MonteCarloResult } from '../hooks/useSandbox'
import ErrorCard from '../components/ErrorCard'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

const SCENARIOS = [
  { id: 'market_crash_30', label: 'Market Stress Test' },
  { id: 'bull_run_25', label: 'Optimal Recovery' },
  { id: 'rate_hike', label: 'Rate Hike Stress' },
  { id: 'conservative', label: 'Conservative Prognosis' },
] as const

const MONTH_LABELS = ['Now', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12']

const FALLBACK_TRAJECTORIES = {
  p10: [342, 320, 310, 298, 285, 275, 265, 258, 252, 248, 245, 243],
  p50: [342, 335, 332, 330, 331, 334, 338, 341, 344, 347, 350, 354],
  p90: [342, 348, 358, 368, 376, 382, 388, 393, 398, 402, 406, 412],
}

function trajectoriesToChartData(t: { p10: number[]; p50: number[]; p90: number[] }) {
  const len = t.p50.length
  return MONTH_LABELS.slice(0, len).map((month, i) => ({
    month: i === 0 ? 'Now' : month,
    p10: Math.round((t.p10[i] ?? 0) / 1000),
    p50: Math.round((t.p50[i] ?? 0) / 1000),
    p90: Math.round((t.p90[i] ?? 0) / 1000),
  }))
}

export default function TreatmentPlan() {
  const sandboxAdjustments = useStore((s) => s.sandboxAdjustments)
  const setSandboxAdjustment = useStore((s) => s.setSandboxAdjustment)
  const sandboxResult = useStore((s) => s.sandboxResult)
  const setSandboxResult = useStore((s) => s.setSandboxResult)
  const [selectedScenario, setSelectedScenario] = useState<string>(SCENARIOS[0].id)
  const [monteCarloResult, setMonteCarloResult] = useState<MonteCarloResult | null>(null)

  const sandboxMutation = useSandbox()
  const monteCarloMutation = useMonteCarlo()
  const loading = sandboxMutation.isPending || monteCarloMutation.isPending
  const error = sandboxMutation.isError || monteCarloMutation.isError

  // Approximation based on scoring algorithm weights — used as live preview while sliders change
  const previewDelta = Math.round(
    Math.min(50, sandboxAdjustments.extra_savings / 23) +
      sandboxAdjustments.debt_payoff / 3500 +
      sandboxAdjustments.equity_rebalance * 0.375 +
      Math.min(50, sandboxAdjustments.passive_income_increase / 23)
  )
  const projectedNetWorth12m = monteCarloResult?.projected_net_worth_12m ?? 354000
  // After simulation: use real results. Before / after slider move: use live approximation.
  const displayWwsDelta = monteCarloResult?.wws_delta ?? sandboxResult?.wws_delta ?? previewDelta

  const chartData = useMemo(() => {
    if (monteCarloResult?.trajectories) {
      return trajectoriesToChartData(monteCarloResult.trajectories)
    }
    return MONTH_LABELS.map((month, i) => ({
      month: i === 0 ? 'Now' : month,
      p10: FALLBACK_TRAJECTORIES.p10[i] ?? 342,
      p50: FALLBACK_TRAJECTORIES.p50[i] ?? 342,
      p90: FALLBACK_TRAJECTORIES.p90[i] ?? 342,
    }))
  }, [monteCarloResult])

  const runSimulation = () => {
    setMonteCarloResult(null)
    sandboxMutation.mutate(sandboxAdjustments, {
      onSuccess: (data) => {
        setSandboxResult(data)
        monteCarloMutation.mutate(
          { scenario: selectedScenario, adjustments: sandboxAdjustments },
          { onSuccess: (mcData) => setMonteCarloResult(mcData) }
        )
      },
    })
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <ErrorCard message="Simulation service unavailable. Check gateway and simulation service." />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-bg p-6 space-y-6">
      <div>
        <p className="text-xs font-medium text-text-muted uppercase tracking-widest mb-2">Scenario</p>
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedScenario(s.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedScenario === s.id
                  ? 'border-2 text-white'
                  : 'border border-border bg-surface text-text-muted hover:text-white hover:border-teal/50'
              }`}
              style={selectedScenario === s.id ? { borderColor: colours.teal, backgroundColor: 'rgba(0,212,170,0.15)' } : undefined}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-white mb-1">Extra Monthly Savings (S$0 → S$2,000)</label>
          <input
            type="range"
            min={0}
            max={2000}
            step={100}
            value={sandboxAdjustments.extra_savings}
            onChange={(e) => { setSandboxAdjustment('extra_savings', Number(e.target.value)); setMonteCarloResult(null); setSandboxResult(null) }}
            className="w-full h-2 rounded-lg appearance-none bg-surface accent-teal"
          />
          <p className="text-xs text-text-muted mt-0.5">S${sandboxAdjustments.extra_savings}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-1">Debt Payoff Lump Sum (S$0 → S$50,000)</label>
          <input
            type="range"
            min={0}
            max={50000}
            step={1000}
            value={sandboxAdjustments.debt_payoff}
            onChange={(e) => { setSandboxAdjustment('debt_payoff', Number(e.target.value)); setMonteCarloResult(null); setSandboxResult(null) }}
            className="w-full h-2 rounded-lg appearance-none bg-surface accent-teal"
          />
          <p className="text-xs text-text-muted mt-0.5">S${sandboxAdjustments.debt_payoff.toLocaleString()}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-1">Equity Rebalance (0% → 20%)</label>
          <input
            type="range"
            min={0}
            max={20}
            step={1}
            value={sandboxAdjustments.equity_rebalance}
            onChange={(e) => { setSandboxAdjustment('equity_rebalance', Number(e.target.value)); setMonteCarloResult(null); setSandboxResult(null) }}
            className="w-full h-2 rounded-lg appearance-none bg-surface accent-teal"
          />
          <p className="text-xs text-text-muted mt-0.5">{sandboxAdjustments.equity_rebalance}%</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-1">Passive Income Increase (S$0 → S$1,000/mo)</label>
          <input
            type="range"
            min={0}
            max={1000}
            step={50}
            value={sandboxAdjustments.passive_income_increase}
            onChange={(e) => { setSandboxAdjustment('passive_income_increase', Number(e.target.value)); setMonteCarloResult(null); setSandboxResult(null) }}
            className="w-full h-2 rounded-lg appearance-none bg-surface accent-teal"
          />
          <p className="text-xs text-text-muted mt-0.5">S${sandboxAdjustments.passive_income_increase}/mo</p>
        </div>
      </div>

      <div
        className="rounded-xl border-2 p-6 text-center"
        style={{
          borderColor: displayWwsDelta >= 0 ? colours.teal : colours.red,
          backgroundColor: displayWwsDelta >= 0 ? 'rgba(0,212,170,0.08)' : 'rgba(239,68,68,0.08)',
        }}
      >
        <p className="text-3xl font-bold" style={{ color: displayWwsDelta >= 0 ? colours.teal : colours.red }}>
          {displayWwsDelta >= 0 ? '+' : ''}{displayWwsDelta} pts
        </p>
        <p className="text-sm text-text-muted mt-1">WWS impact from adjustments</p>
      </div>

      <div>
        <button
          onClick={runSimulation}
          disabled={loading}
          className="w-full md:w-auto px-6 py-3 rounded-xl text-sm font-semibold text-bg disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ backgroundColor: colours.teal }}
        >
          {loading ? 'Running…' : 'Run Simulation'}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-sm font-medium text-white mb-4">12‑month net worth range (S$k)</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8' }} stroke="#1E293B" />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} stroke="#1E293B" tickFormatter={(v) => `S$${v}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F1623', border: '1px solid #1E293B', borderRadius: 8 }}
                labelStyle={{ color: '#94A3B8' }}
                formatter={(value: number) => [`S$${value}k`, '']}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <ReferenceLine y={342} stroke="#1E293B" strokeDasharray="2 2" />
              <Area type="monotone" dataKey="p90" stroke="transparent" fill={colours.teal} fillOpacity={0.2} />
              <Area type="monotone" dataKey="p10" stroke="transparent" fill="#080C14" />
              <Area type="monotone" dataKey="p50" stroke={colours.teal} strokeWidth={2} fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 text-sm text-text-muted">
        <span className="text-white font-medium">Projected Net Worth in 12 months:</span> S$
        {projectedNetWorth12m.toLocaleString()} <span className="mx-2">|</span>
        <span className="text-white font-medium">WWS Impact:</span> {displayWwsDelta >= 0 ? '+' : ''}
        {displayWwsDelta} pts
      </div>
    </div>
  )
}
