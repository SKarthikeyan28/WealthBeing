interface Props {
  title?: string
  message?: string
}

export default function ErrorCard({ title = 'Unable to retrieve vital reading', message }: Props) {
  return (
    <div className="rounded-xl border border-danger/50 bg-surface p-6 text-center max-w-md mx-auto">
      <p className="text-sm font-medium text-white">{title}</p>
      {message && <p className="text-xs text-text-muted mt-2">{message}</p>}
    </div>
  )
}
