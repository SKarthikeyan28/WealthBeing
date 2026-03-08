import { motion } from 'framer-motion'
import StatusBadge from './StatusBadge'
import type { Status } from '../constants/theme'
import { statusColour } from '../constants/theme'

interface Props {
  label: string
  score: number
  weight: number
  status: Status
}

export default function VitalBar({ label, score, weight, status }: Props) {
  const colour = statusColour[status]

  return (
    <div className="flex flex-col gap-1.5">
      {/* ── Row: label + score + badge ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm font-medium text-white truncate">{label}</span>
          <span className="text-xs text-text-muted flex-shrink-0">
            ({Math.round(weight * 100)}%)
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-semibold tabular-nums" style={{ color: colour }}>
            {score}/100
          </span>
          <StatusBadge status={status} />
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: colour }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
