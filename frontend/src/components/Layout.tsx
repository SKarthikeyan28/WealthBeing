import { NavLink, Outlet } from 'react-router-dom'
import { PANEL_NAMES, colours } from '../constants/theme'
import { useStore } from '../store'

// ─── Nav Items ───────────────────────────────────────────────────────────────

const NAV_ITEMS: { path: string; label: string; icon: string }[] = [
  { path: '/pulse',        label: PANEL_NAMES.pulse,        icon: '♥' },
  { path: '/vitals',       label: PANEL_NAMES.vitals,       icon: '◈' },
  { path: '/prescription', label: PANEL_NAMES.prescription, icon: 'Rx' },
  { path: '/treatment',    label: PANEL_NAMES.treatment,    icon: '⚕' },
  { path: '/anatomy',      label: PANEL_NAMES.anatomy,      icon: '◉' },
  { path: '/cashflow',     label: PANEL_NAMES.cashflow,     icon: '⇄' },
]

// ─── Layout ──────────────────────────────────────────────────────────────────

export default function Layout() {
  const { persona, setPersona } = useStore()

  const isAdviser = persona === 'ADVISER'

  return (
    <div className="flex h-screen bg-bg text-white overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-border bg-surface">

        {/* Wordmark */}
        <div className="px-5 py-5 border-b border-border">
          <p
            className="text-base font-bold tracking-tight"
            style={{ color: colours.teal }}
          >
            WealthBeing
          </p>
          <p className="text-xs text-text-muted mt-0.5 tracking-wide">
            Wealth Wellness Hub
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ path, label, icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-teal/10 text-teal border-l-2 border-teal pl-[10px]'
                    : 'text-text-muted hover:text-white hover:bg-white/5 border-l-2 border-transparent pl-[10px]',
                ].join(' ')
              }
            >
              {/* Icon — fixed width keeps labels aligned */}
              <span
                className="text-xs font-bold w-5 text-center flex-shrink-0 select-none"
                aria-hidden
              >
                {icon}
              </span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Persona Toggle */}
        <div className="p-4 border-t border-border">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2">
            View Mode
          </p>
          <div
            className="flex rounded-lg border border-border overflow-hidden"
            role="group"
            aria-label="View mode"
          >
            {(['CLIENT', 'ADVISER'] as const).map((p) => {
              const active = persona === p
              const activeColor = p === 'ADVISER' ? colours.purple : colours.teal
              return (
                <button
                  key={p}
                  onClick={() => setPersona(p)}
                  className="flex-1 text-[11px] py-2 font-semibold transition-all duration-150"
                  style={
                    active
                      ? { background: `${activeColor}22`, color: activeColor }
                      : { color: colours.textMuted }
                  }
                  aria-pressed={active}
                >
                  {p === 'CLIENT' ? 'My Check-Up' : 'Clinical View'}
                </button>
              )
            })}
          </div>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="h-14 flex-shrink-0 border-b border-border flex items-center justify-between px-6">
          <h2 className="text-sm text-text-muted font-normal">
            {isAdviser ? (
              <>
                <span style={{ color: colours.purple }} className="font-semibold">
                  Clinical View
                </span>
                {' — Patient: '}
                <span className="text-white font-semibold">Alex Johnson</span>
              </>
            ) : (
              <>
                Annual Wealth Check-Up{' — '}
                <span className="text-white font-semibold">Alex Johnson</span>
              </>
            )}
          </h2>

          {/* Mode badge */}
          <span
            className="text-[11px] font-semibold px-3 py-1 rounded-full tracking-wide transition-all duration-200"
            style={{
              background: isAdviser ? `${colours.purple}1A` : `${colours.teal}1A`,
              color:      isAdviser ? colours.purple         : colours.teal,
              border:     `1px solid ${isAdviser ? colours.purple : colours.teal}33`,
            }}
          >
            {isAdviser ? '⚕ Clinical View' : '♥ My Check-Up'}
          </span>
        </header>

        {/* Panel content */}
        <main className="flex-1 overflow-auto p-6 bg-bg">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
