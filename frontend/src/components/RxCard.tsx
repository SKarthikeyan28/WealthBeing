import { motion } from 'framer-motion'
import { colours } from '../constants/theme'

interface Props {
  vital: string
  title: string
  body: string
  prescribedAction: string
  rxId?: string
  isAdviserMode?: boolean
  onAddNote?: (rxId: string) => void
}

export default function RxCard({
  vital,
  title,
  body,
  prescribedAction,
  rxId,
  isAdviserMode,
  onAddNote,
}: Props) {
  return (
    <motion.div
      className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-3 cursor-default"
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      style={{
        boxShadow: '0 0 0 0 transparent',
      }}
      whileTap={{ scale: 0.99 }}
    >
      {/* ── Header: vital tag + title + Rx badge ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            {vital}
          </span>
          <h3 className="text-sm font-semibold text-white mt-0.5 leading-snug">{title}</h3>
        </div>
        <span
          className="text-base font-bold flex-shrink-0 leading-none mt-0.5"
          style={{ color: colours.teal, fontStyle: 'italic' }}
          aria-label="Prescription"
        >
          Rx
        </span>
      </div>

      {/* ── Body ── */}
      <p className="text-sm text-text-muted leading-relaxed">{body}</p>

      {/* ── Prescribed Action — teal left-border callout ── */}
      <div
        className="rounded-r-lg pl-3 py-2 pr-2"
        style={{
          borderLeft: `2px solid ${colours.teal}`,
          background: `${colours.teal}0D`,
        }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-0.5">
          Prescribed Action
        </p>
        <p className="text-sm text-white font-medium leading-snug">{prescribedAction}</p>
      </div>

      {/* ── Adviser mode: Add Clinical Note ── */}
      {isAdviserMode && onAddNote && rxId && (
        <button
          onClick={() => onAddNote(rxId)}
          className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-80 self-start"
          style={{ color: colours.purple }}
        >
          <span className="text-base leading-none">+</span>
          Add Clinical Note
        </button>
      )}
    </motion.div>
  )
}
