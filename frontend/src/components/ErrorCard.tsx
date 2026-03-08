interface Props {
  title?: string
  message?: string
  onRetry?: () => void
}

export default function ErrorCard({
  title = 'Vital Reading Unavailable',
  message,
  onRetry,
}: Props) {
  return (
    <div
      className="rounded-xl border border-danger/50 p-5 max-w-md mx-auto"
      style={{ backgroundColor: 'rgba(239,68,68,0.05)' }}
    >
      <div className="flex items-start gap-3">
        <span className="text-base leading-none flex-shrink-0 mt-0.5" style={{ color: '#EF4444' }}>
          ⚕
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{title}</p>
          {message && (
            <p className="text-xs text-text-muted mt-1.5 leading-snug">{message}</p>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg border border-danger/50 transition-colors hover:bg-danger/10"
              style={{ color: '#EF4444' }}
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
