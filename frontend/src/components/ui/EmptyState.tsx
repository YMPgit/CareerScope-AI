import { ReactNode } from 'react'
import { Inbox, AlertTriangle, SearchX } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: { label: string; onClick?: () => void; href?: string }
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center dark:border-slate-700">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-surface-800">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      {description && <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {action &&
        (action.href ? (
          <a href={action.href} className="btn-primary mt-1">
            {action.label}
          </a>
        ) : (
          <Button onClick={action.onClick} className="mt-1">
            {action.label}
          </Button>
        ))}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center dark:border-red-900/50 dark:bg-red-900/10">
      <AlertTriangle className="h-8 w-8 text-red-500" />
      <h3 className="text-base font-semibold text-red-700 dark:text-red-300">Something went wrong</h3>
      <p className="max-w-md text-sm text-red-600 dark:text-red-400">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-1">
          Try again
        </Button>
      )}
    </div>
  )
}

export function NoJobsState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-700">
      <SearchX className="h-8 w-8 text-slate-400" />
      <h3 className="text-base font-semibold">No relevant jobs were found</h3>
      <p className="max-w-md text-sm text-slate-500">
        No relevant jobs were found for this combination of role and location. Try another location or job title.
      </p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}