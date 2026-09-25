import { Info } from 'lucide-react'

interface Props {
  score: number | null | undefined
  explanation?: string | null
}

export function GaugeCard({ score, explanation }: Props) {
  const display = score === null || score === undefined ? '–' : Math.round(score)
  const pct = score === null || score === undefined ? 0 : Math.max(0, Math.min(100, score))
  const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="card">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        <div className="relative h-36 w-36 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" strokeWidth="12" className="stroke-slate-100 dark:stroke-surface-800" />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              strokeWidth="12"
              strokeLinecap="round"
              stroke={color}
              strokeDasharray={`${(pct / 100) * 326.7} 326.7`}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{display}%</span>
            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Alignment</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">CareerScope Market Alignment Score</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            This is <span className="font-semibold">not</span> an employability probability. It measures how much of today's documented
            skill demand (weighted by how often each skill appears in live job postings) is covered by your resume.
          </p>
          {explanation && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-brand-50 p-3 text-xs text-brand-800 dark:bg-brand-900/30 dark:text-brand-200">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{explanation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}