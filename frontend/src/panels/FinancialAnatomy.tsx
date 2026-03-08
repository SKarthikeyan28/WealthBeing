import { useStore } from '../store'

export default function FinancialAnatomy() {
  const portfolio = useStore((s) => s.portfolio)

  if (!portfolio) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl border border-border bg-surface h-32 w-64 animate-pulse" />
      </div>
    )
  }

  const assets = portfolio.assets as Record<string, { total?: number; equity?: number } | undefined>
  const liabilities = portfolio.liabilities as Record<string, { outstanding?: number } | undefined>
  const goals = portfolio.goals ?? []

  const assetItems: { name: string; value: number }[] = []
  if (assets.equities?.total) assetItems.push({ name: 'Equities', value: assets.equities.total })
  if (assets.cpf) {
    const cpf = assets.cpf as Record<string, number>
    const total = (cpf.ordinary_account ?? 0) + (cpf.special_account ?? 0) + (cpf.medisave ?? 0)
    if (total > 0) assetItems.push({ name: 'CPF', value: total })
  }
  if (assets.real_estate?.equity) assetItems.push({ name: 'Real estate equity', value: assets.real_estate.equity })
  if (assets.cash) {
    const cash = assets.cash as { emergency_fund?: number; savings_account?: number }
    const total = (cash.emergency_fund ?? 0) + (cash.savings_account ?? 0)
    if (total > 0) assetItems.push({ name: 'Cash', value: total })
  }
  if (assets.crypto?.total) assetItems.push({ name: 'Crypto', value: (assets.crypto as { total: number }).total })
  if (assets.bonds?.total) assetItems.push({ name: 'Bonds', value: (assets.bonds as { total: number }).total })

  const totalAssets = assetItems.reduce((a, b) => a + b.value, 0)
  const mortgage = liabilities?.hdb_mortgage?.outstanding ?? 0
  const creditCard = (liabilities?.credit_card as { outstanding?: number } | undefined)?.outstanding ?? 0

  return (
    <div className="h-full overflow-y-auto bg-bg p-6 space-y-6">
      <div>
        <p className="text-sm font-medium text-white mb-3">Asset classes</p>
        <div className="space-y-2">
          {assetItems.map((item) => (
            <div key={item.name} className="flex justify-between items-center rounded-lg border border-border bg-surface px-4 py-2">
              <span className="text-sm text-white">{item.name}</span>
              <span className="text-sm font-medium text-white">S${item.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-white mb-3">Liabilities</p>
        <div className="space-y-2">
          {mortgage > 0 && (
            <div className="flex justify-between items-center rounded-lg border border-border bg-surface px-4 py-2">
              <span className="text-sm text-white">HDB mortgage</span>
              <span className="text-sm font-medium text-white">S${mortgage.toLocaleString()}</span>
            </div>
          )}
          {creditCard > 0 && (
            <div className="flex justify-between items-center rounded-lg border border-border bg-surface px-4 py-2">
              <span className="text-sm text-white">Credit card</span>
              <span className="text-sm font-medium text-white">S${creditCard.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {goals.length > 0 && (
        <div>
          <p className="text-sm font-medium text-white mb-3">Goals</p>
          <div className="space-y-3">
            {goals.map((g) => (
              <div key={g.id} className="rounded-lg border border-border bg-surface p-4">
                <p className="text-sm font-medium text-white">{g.name}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  S${g.current.toLocaleString()} / S${g.target.toLocaleString()} · {g.deadline}
                </p>
                <div className="h-1.5 rounded-full bg-border overflow-hidden mt-2">
                  <div
                    className="h-full rounded-full bg-teal"
                    style={{ width: `${Math.min(100, (g.current / g.target) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
