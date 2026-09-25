import { Check, Loader2, X, Circle } from 'lucide-react'

export interface ProgressStep {
  id: string
  label: string
}

const STEPS: ProgressStep[] = [
  { id: 'queued', label: 'Queued your analysis' },
  { id: 'resume_analyzer', label: 'Resume analyzed' },
  { id: 'job_market', label: 'Searching live jobs' },
  { id: 'skill_intelligence', label: 'Analyzing market demand' },
  { id: 'skill_gap', label: 'Comparing your skills' },
  { id: 'career_planner', label: 'Building career roadmap' },
  { id: 'insight', label: 'Writing your report' },
  { id: 'persist', label: 'Saving your results' },
]

export function currentStageIndex(completed: string[], current: string | null | undefined): number {
  const done = new Set(completed)
  let latest = 0
  for (let i = 0; i < STEPS.length; i++) {
    if (done.has(STEPS[i].id)) latest = i
  }
  if (current && !done.has(current)) {
    const idx = STEPS.findIndex((s) => s.id === current)
    if (idx !== -1) latest = idx
  }
  return latest
}

export function ProgressSteps({ completed, current, failed }: { completed: string[]; current?: string | null; failed?: boolean }) {
  const updateIndex = currentStageIndex(completed, current)
  const doneSet = new Set(completed)

  return (
    <ol className="w-full space-y-3">
      {STEPS.map((step, idx) => {
        const isDone = doneSet.has(step.id) || (idx <= updateIndex && !failed && current && current !== 'queued')
        const isCurrent = !failed && idx === Math.min(updateIndex + (doneSet.has(step.id) ? 0 : 1), STEPS.length - 1) && idx >= updateIndex && !doneSet.has(step.id)
        const isActive = !failed && (idx === updateIndex || isCurrent || idx === updateIndex)
        const displayCurrent = !failed && idx === updateIndex && !doneSet.has(step.id)

        return (
          <li key={step.id} className="flex items-center gap-3">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                isDone
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : failed
                    ? 'border-slate-300 text-slate-400 dark:border-slate-700'
                    : displayCurrent
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600'
                      : 'border-slate-300 text-slate-400 dark:border-slate-700'
              }`}
            >
              {isDone ? (
                <Check className="h-4 w-4" />
              ) : failed ? (
                <X className="h-4 w-4" />
              ) : displayCurrent ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )}
            </span>
            <span
              className={`text-sm ${
                isDone
                  ? 'font-medium text-slate-700 dark:text-slate-200'
                  : displayCurrent
                    ? 'font-medium text-slate-900 dark:text-white'
                    : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {step.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}