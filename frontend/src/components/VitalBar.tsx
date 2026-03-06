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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{label}</span>
          <span className="text-xs text-text-muted">({Math.round(weight * 100)}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: colour }}>{score}/100</span>
          <StatusBadge status={status} />
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: colour }}
        />
      </div>
    </div>
  )
}
