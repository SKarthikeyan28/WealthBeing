import { colours } from '../constants/theme'

interface Props {
  vital: string
  title: string
  body: string
  prescribedAction: string
  onAddNote?: (rxId: string) => void
  rxId?: string
  isAdviserMode?: boolean
}

export default function RxCard({ vital, title, body, prescribedAction, onAddNote, rxId, isAdviserMode }: Props) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-medium text-text-muted uppercase tracking-widest">{vital}</span>
          <h3 className="text-sm font-semibold text-white mt-0.5">{title}</h3>
        </div>
        <span className="text-lg font-bold" style={{ color: colours.teal }}>Rx</span>
      </div>

      <p className="text-sm text-text-muted leading-relaxed">{body}</p>

      <div className="border-l-2 pl-3 py-1" style={{ borderColor: colours.teal }}>
        <p className="text-xs font-medium text-text-muted">Prescribed Action</p>
        <p className="text-sm text-white font-medium mt-0.5">{prescribedAction}</p>
      </div>

      {isAdviserMode && onAddNote && rxId && (
        <button
          onClick={() => onAddNote(rxId)}
          className="text-xs text-purple underline text-left hover:opacity-80 transition-opacity"
        >
          + Add Clinical Note
        </button>
      )}
    </div>
  )
}
