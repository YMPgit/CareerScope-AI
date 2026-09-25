import { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: ReactNode
  sub?: ReactNode
  icon?: ReactNode
  tone?: 'default' | 'brand' | 'green'
}

const toneClass = {
  default: 'text-slate-500 dark:text-slate-400',
  brand: 'text-brand-600 dark:text-brand-400',
  green: 'text-emerald-600 dark:text-emerald-400',
}

export function StatCard({ label, value, sub, icon, tone = 'default' }: StatCardProps) {
  return (
    <div className="card flex items-start gap-4">
      {icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-surface-800 dark:text-slate-300">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <p className={`mt-1 truncate text-xl font-bold text-slate-900 dark:text-white ${!icon && toneClass[tone]}`}>{value}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
      </div>
    </div>
  )
}