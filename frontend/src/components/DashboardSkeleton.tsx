export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-bg p-6 flex flex-col gap-6">
      <div className="h-8 w-64 rounded-lg bg-surface animate-pulse" />
      <div className="flex gap-6 flex-1">
        <div className="w-64 rounded-xl bg-surface animate-pulse" />
        <div className="flex-1 grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl bg-surface h-24 animate-pulse" />
          ))}
        </div>
      </div>
      <div className="h-48 rounded-xl bg-surface animate-pulse" />
    </div>
  )
}
