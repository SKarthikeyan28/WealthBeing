import type { Status } from '../constants/theme'
import { STATUS_LABELS } from '../constants/theme'

interface Props {
  status: Status
}

const colourMap: Record<Status, string> = {
  healthy:  'bg-teal/10 text-teal border border-teal/30',
  monitor:  'bg-amber/10 text-amber border border-amber/30',
  critical: 'bg-danger/10 text-danger border border-danger/30',
}

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colourMap[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
