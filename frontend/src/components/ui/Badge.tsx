import { ReactNode } from 'react'

type Tone = 'gray' | 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'cyan'

const toneClass: Record<Tone, string> = {
  gray: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  blue: 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300',
  purple: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  cyan: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
}

export function Badge({ children, tone = 'gray', className = '' }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClass[tone]} ${className}`}>
      {children}
    </span>
  )
}

export function gapTone(level: string): Tone {
  if (level === 'strong') return 'green'
  if (level === 'partial') return 'amber'
  return 'red'
}

export function priorityTone(priority: string): Tone {
  if (priority === 'high') return 'red'
  if (priority === 'medium') return 'amber'
  return 'gray'
}