export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}

export function CardSkeleton() {
  return (
    <div className="card space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-8 w-full" />
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="card space-y-3">
      <Skeleton className="h-4 w-1/2" />
      <div className="flex items-end gap-2 pt-4" style={{ height: 220 }}>
        {[40, 65, 55, 85, 30, 70, 45].map((h, i) => (
          <div key={i} className="flex-1 rounded-t-md bg-slate-100 dark:bg-surface-800" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  )
}