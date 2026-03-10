import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { colours } from '../constants/theme'
import { apiClient } from '../constants/api'
import { buildPortfolioFromForm, defaultFormValues, portfolioToFormValues, type FinancialHealthFormValues } from '../utils/buildPortfolioFromForm'
import { useSubmitMyPortfolio } from '../hooks/useScore'
import ErrorCard from './ErrorCard'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function buildMonthOptions(): { value: string; label: string }[] {
  const now = new Date()
  const options: { value: string; label: string }[] = []
  for (let i = -12; i <= 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const y = d.getFullYear()
    const m = d.getMonth()
    const value = `${y}-${String(m + 1).padStart(2, '0')}`
    options.push({ value, label: `${MONTH_NAMES[m]} ${y}` })
  }
  return options
}

const MONTH_OPTIONS = buildMonthOptions()

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
      <h3 className="text-sm font-semibold text-white uppercase tracking-widest">{title}</h3>
      {children}
    </div>
  )
}

function Field({
  label,
  unit = '',
  value,
  onChange,
  type = 'number',
  min = 0,
  step = 1,
  placeholder,
}: {
  label: string
  unit?: string
  value: number | string
  onChange: (v: number | string) => void
  type?: 'number' | 'text'
  min?: number
  step?: number
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs text-text-muted mb-1">{label}</label>
      <div className="flex items-center gap-2">
        {unit && unit.startsWith('S$') && <span className="text-sm text-text-muted">S$</span>}
        <input
          type={type}
          min={min}
          step={step}
          value={value}
          onChange={(e) => (type === 'number' ? onChange(e.target.valueAsNumber || 0) : onChange(e.target.value))}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:border-teal"
        />
        {unit && !unit.startsWith('S$') && <span className="text-xs text-text-muted">{unit}</span>}
      </div>
    </div>
  )
}

export default function FinancialHealthForm() {
  const navigate = useNavigate()
  const user = useStore((s) => s.user)
  const portfolio = useStore((s) => s.portfolio)
  const setPortfolio = useStore((s) => s.setPortfolio)
  const setWws = useStore((s) => s.setWws)
  const setVitals = useStore((s) => s.setVitals)
  const setDiagnosisSummary = useStore((s) => s.setDiagnosisSummary)
  const setPrescribedActions = useStore((s) => s.setPrescribedActions)

  const [values, setValues] = useState<FinancialHealthFormValues>(defaultFormValues)
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [snapshots, setSnapshots] = useState<{ month: string; updated_at: string | null; net_worth: number | null; wws: number | null }[]>([])
  const submitMutation = useSubmitMyPortfolio()

  useEffect(() => {
    if (!user) return
    apiClient.get('/api/user/portfolio/snapshots').then((snapRes: { data: { month: string; updated_at: string | null; net_worth: number | null; wws: number | null }[] }) => {
      const list = snapRes.data || []
      setSnapshots(list)
      if (list.length > 0) setSelectedMonth(list[list.length - 1].month)
    }).catch(() => {})
    apiClient.get<import('../store').Portfolio>('/api/user/portfolio').then((res) => setValues(portfolioToFormValues(res.data))).catch(() => {})
  }, [user])

  useEffect(() => {
    if (user != null || portfolio == null) return
    setValues(portfolioToFormValues(portfolio))
  }, [user, portfolio])

  const update = (key: keyof FinancialHealthFormValues, value: number | string) => {
    setValues((v) => ({ ...v, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const portfolioPayload = buildPortfolioFromForm(values)
    submitMutation.mutate(portfolioPayload, {
      onSuccess: async (scoreData) => {
        setPortfolio(portfolioPayload)
        setWws(scoreData.wws)
        setVitals(scoreData.vitals)
        setDiagnosisSummary(scoreData.diagnosis_summary)
        setPrescribedActions(scoreData.prescribed_actions)
        if (user) {
          await apiClient.put('/api/user/portfolio', { portfolio: portfolioPayload, month: selectedMonth, wws: scoreData.wws }).catch(() => {})
        }
        navigate('/pulse', { replace: true })
      },
    })
  }

  if (submitMutation.isError) {
    return (
      <div className="max-w-lg mx-auto py-8">
        <ErrorCard
          title="Unable to calculate score"
          message={submitMutation.error?.message}
          onRetry={() => submitMutation.reset()}
        />
        <button
          type="button"
          onClick={() => submitMutation.reset()}
          className="mt-4 w-full py-2 rounded-lg border border-border text-sm text-text-muted hover:text-white"
        >
          Back to form
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Check my health</h1>
        <p className="text-sm text-text-muted mt-1">
          Enter your numbers to see your Wealth Wellness Score and vitals.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {user && (
          <Section title="Data for month">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-text-muted mb-1">As of month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:border-teal"
                >
                  {MONTH_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {snapshots.length > 0 && (
                <div>
                  <label className="block text-xs text-text-muted mb-1">Load saved month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => {
                      const month = e.target.value
                      setSelectedMonth(month)
                      apiClient.get<import('../store').Portfolio>(`/api/user/portfolio?month=${encodeURIComponent(month)}`).then((res) => setValues(portfolioToFormValues(res.data))).catch(() => setValues(defaultFormValues))
                    }}
                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:border-teal"
                  >
                    {snapshots.map((s) => (
                      <option key={s.month} value={s.month}>{s.month}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </Section>
        )}
        <Section title="Profile">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name" type="text" value={values.name} onChange={(v) => update('name', v)} placeholder="Your name" />
            <Field label="Age" value={values.age} onChange={(v) => update('age', v)} min={18} />
          </div>
        </Section>

        <Section title="Cash flow">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Monthly income (S$)" unit="S$" value={values.monthly_income} onChange={(v) => update('monthly_income', v)} step={100} />
            <p className="text-xs text-text-muted sm:col-span-2">Monthly expenses by category</p>
            <Field label="Housing" unit="S$" value={values.expense_housing} onChange={(v) => update('expense_housing', v)} step={50} />
            <Field label="Food" unit="S$" value={values.expense_food} onChange={(v) => update('expense_food', v)} step={50} />
            <Field label="Transport" unit="S$" value={values.expense_transport} onChange={(v) => update('expense_transport', v)} step={50} />
            <Field label="Insurance" unit="S$" value={values.expense_insurance} onChange={(v) => update('expense_insurance', v)} step={50} />
            <Field label="Entertainment" unit="S$" value={values.expense_entertainment} onChange={(v) => update('expense_entertainment', v)} step={50} />
            <Field label="Utilities" unit="S$" value={values.expense_utilities} onChange={(v) => update('expense_utilities', v)} step={50} />
            <Field label="Other" unit="S$" value={values.expense_other} onChange={(v) => update('expense_other', v)} step={50} />
            <p className="text-xs text-text-muted sm:col-span-2">
              Total expenses: S$
              {(values.expense_housing + values.expense_food + values.expense_transport + values.expense_insurance + values.expense_entertainment + values.expense_utilities + values.expense_other).toLocaleString()}
            </p>
          </div>
        </Section>

        <Section title="Liquid assets">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Emergency fund (S$)" unit="S$" value={values.emergency_fund} onChange={(v) => update('emergency_fund', v)} step={500} />
            <Field label="Savings account (S$)" unit="S$" value={values.savings_account} onChange={(v) => update('savings_account', v)} step={500} />
          </div>
        </Section>

        <Section title="Assets">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Equities total (S$)" unit="S$" value={values.equities_total} onChange={(v) => update('equities_total', v)} step={1000} />
            <Field label="CPF total (S$)" unit="S$" value={values.cpf_total} onChange={(v) => update('cpf_total', v)} step={1000} />
            <Field label="Real estate equity (S$)" unit="S$" value={values.real_estate_equity} onChange={(v) => update('real_estate_equity', v)} step={1000} />
            <Field label="Crypto total (S$)" unit="S$" value={values.crypto_total} onChange={(v) => update('crypto_total', v)} step={500} />
            <Field label="Bonds total (S$)" unit="S$" value={values.bonds_total} onChange={(v) => update('bonds_total', v)} step={500} />
            <Field label="Top holding % of equity" value={values.top_holding_pct} onChange={(v) => update('top_holding_pct', v)} min={0} step={1} />
          </div>
        </Section>

        <Section title="Liabilities">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Mortgage outstanding (S$)" unit="S$" value={values.mortgage_outstanding} onChange={(v) => update('mortgage_outstanding', v)} step={1000} />
            <Field label="Credit card outstanding (S$)" unit="S$" value={values.credit_card_outstanding} onChange={(v) => update('credit_card_outstanding', v)} step={100} />
          </div>
        </Section>

        <Section title="Optional">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="YoY net worth growth (e.g. 0.05 = 5%)" value={values.yoy_net_worth_growth ?? 0.05} onChange={(v) => update('yoy_net_worth_growth', v)} step={0.01} />
            <Field label="Panic sells (last 12 mo)" value={values.panic_sells ?? 0} onChange={(v) => update('panic_sells', v)} min={0} />
            <Field label="Reactive trades" value={values.reactive_trades ?? 0} onChange={(v) => update('reactive_trades', v)} min={0} />
          </div>
        </Section>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={submitMutation.isPending || values.monthly_income <= 0}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-bg disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            style={{ backgroundColor: colours.teal }}
          >
            {submitMutation.isPending ? 'Calculating…' : 'See my financial health'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/pulse')}
            className="py-3 px-6 rounded-xl border border-border text-sm text-text-muted hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
