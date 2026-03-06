import { NavLink, Outlet } from 'react-router-dom'
import { PANEL_NAMES, colours } from '../constants/theme'
import { useStore } from '../store'

const NAV_ITEMS: { path: string; label: string; icon: string }[] = [
  { path: '/pulse',        label: PANEL_NAMES.pulse,        icon: '♥' },
  { path: '/vitals',       label: PANEL_NAMES.vitals,       icon: '📊' },
  { path: '/prescription', label: PANEL_NAMES.prescription, icon: '💊' },
  { path: '/treatment',    label: PANEL_NAMES.treatment,    icon: '🔬' },
  { path: '/anatomy',      label: PANEL_NAMES.anatomy,      icon: '🫀' },
  { path: '/cashflow',     label: PANEL_NAMES.cashflow,     icon: '💸' },
]

export default function Layout() {
  const { persona, setPersona } = useStore()

  return (
    <div className="flex h-screen bg-bg text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-r border-border flex flex-col">
        <div className="p-5 border-b border-border">
          <h1 className="text-lg font-bold" style={{ color: colours.teal }}>WealthBeing</h1>
          <p className="text-xs text-text-muted mt-0.5">Wealth Wellness Hub</p>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_ITEMS.map(({ path, label, icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal/10 text-teal'
                    : 'text-text-muted hover:text-white hover:bg-surface'
                }`
              }
            >
              <span className="text-base">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <p className="text-xs text-text-muted mb-2">View Mode</p>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(['CLIENT', 'ADVISER'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPersona(p)}
                className={`flex-1 text-xs py-2 font-medium transition-colors ${
                  persona === p ? 'bg-teal text-bg' : 'text-text-muted hover:text-white'
                }`}
              >
                {p === 'CLIENT' ? 'My Check-Up' : 'Clinical View'}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border flex items-center justify-between px-6 flex-shrink-0">
          <h2 className="text-sm font-medium text-text-muted">
            Annual Wealth Check-Up —{' '}
            <span className="text-white font-semibold">Alex Johnson</span>
          </h2>
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-medium px-3 py-1 rounded-full"
              style={{
                background: persona === 'ADVISER' ? `${colours.purple}20` : `${colours.teal}20`,
                color: persona === 'ADVISER' ? colours.purple : colours.teal,
              }}
            >
              {persona === 'ADVISER' ? 'Clinical View' : 'My Check-Up'}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
