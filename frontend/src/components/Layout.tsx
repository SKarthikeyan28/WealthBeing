import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { PANEL_NAMES, colours } from '../constants/theme'
import { useStore } from '../store'
import type { ClinicalNote } from '../store'

// ─── Nav Items ───────────────────────────────────────────────────────────────

const NAV_ITEMS: { path: string; label: string; icon: string }[] = [
  { path: '/check', label: 'Check my health', icon: '✎' },
  { path: '/pulse', label: PANEL_NAMES.pulse, icon: '♥' },
  { path: '/vitals', label: PANEL_NAMES.vitals, icon: '◈' },
  { path: '/prescription', label: PANEL_NAMES.prescription, icon: 'Rx' },
  { path: '/treatment', label: PANEL_NAMES.treatment, icon: '⚕' },
  { path: '/anatomy', label: PANEL_NAMES.anatomy, icon: '◉' },
  { path: '/cashflow', label: PANEL_NAMES.cashflow, icon: '⇄' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-SG', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function vitalLabel(vital: string): string {
  return vital
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// ─── Clinical Notes Sidebar ───────────────────────────────────────────────────

function ClinicalNotesSidebar({ notes }: { notes: ClinicalNote[] }) {
  // Newest first
  const sorted = [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <motion.aside
      className="w-64 flex-shrink-0 border-l border-border bg-surface flex flex-col"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-border flex items-center gap-2">
        <span style={{ color: colours.purple }} className="text-sm">⚕</span>
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: colours.purple }}
        >
          Clinical Observations
        </p>
      </div>

      {/* Note list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {sorted.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-8 leading-relaxed">
            No clinical observations yet.
          </p>
        ) : (
          sorted.map((note) => (
            <motion.div
              key={note.id}
              className="rounded-lg border border-border bg-bg p-3 flex flex-col gap-1.5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Vital tag + timestamp row */}
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: `${colours.purple}1A`,
                    color: colours.purple,
                  }}
                >
                  {vitalLabel(note.vital)}
                </span>
                <span className="text-[10px] text-text-muted flex-shrink-0">
                  {formatTimestamp(note.createdAt)}
                </span>
              </div>

              {/* Note text */}
              <p className="text-xs text-white leading-snug">{note.text}</p>
            </motion.div>
          ))
        )}
      </div>

      {/* Footer count */}
      {sorted.length > 0 && (
        <div className="px-4 py-3 border-t border-border">
          <p className="text-[10px] text-text-muted">
            {sorted.length} observation{sorted.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </motion.aside>
  )
}

// ─── Layout ──────────────────────────────────────────────────────────────────

export default function Layout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, clearAuth, persona, setPersona, clinicalNotes, portfolio } = useStore()
  const isAdviser = persona === 'ADVISER'

  const handleUseDemoAgain = () => {
    queryClient.refetchQueries({ queryKey: ['dashboard'] })
  }

  const handleSignOut = () => {
    clearAuth()
    queryClient.refetchQueries({ queryKey: ['dashboard'] })
    navigate('/pulse', { replace: true })
  }

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
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Header */}
        <header className="h-14 flex-shrink-0 border-b border-border flex items-center justify-between px-6 gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <h2 className="text-sm text-text-muted font-normal truncate">
              {isAdviser ? (
                <>
                  <span style={{ color: colours.purple }} className="font-semibold">
                    Clinical View
                  </span>
                  {' — Patient: '}
                  <span className="text-white font-semibold">{portfolio?.patient?.name ?? 'Alex Johnson'}</span>
                </>
              ) : (
                <>
                  Annual Wealth Check-Up{' — '}
                  <span className="text-white font-semibold">{portfolio?.patient?.name ?? 'Alex Johnson'}</span>
                </>
              )}
            </h2>
            {!user && (
              <button
                type="button"
                onClick={handleUseDemoAgain}
                className="text-[11px] text-text-muted hover:text-white transition-colors flex-shrink-0"
              >
                Use Alex's demo data
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {user ? (
              <>
                <span className="text-[11px] text-text-muted truncate max-w-[120px]" title={user.email}>
                  {user.name}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-[11px] text-text-muted hover:text-white transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className="text-[11px] text-text-muted hover:text-white transition-colors"
              >
                Log in
              </NavLink>
            )}

            {/* Mode badge */}
            <span
              className="text-[11px] font-semibold px-3 py-1 rounded-full tracking-wide transition-all duration-200"
              style={{
                background: isAdviser ? `${colours.purple}1A` : `${colours.teal}1A`,
                color: isAdviser ? colours.purple : colours.teal,
                border: `1px solid ${isAdviser ? colours.purple : colours.teal}33`,
              }}
            >
              {isAdviser ? '⚕ Clinical View' : '♥ My Check-Up'}
            </span>
          </div>
        </header>

        {/* Content row: panel + optional clinical notes sidebar */}
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-auto p-6 bg-bg min-w-0">
            <Outlet />
          </main>

          {/* Clinical Notes Sidebar — ADVISER mode only */}
          <AnimatePresence>
            {isAdviser && (
              <ClinicalNotesSidebar notes={clinicalNotes} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
