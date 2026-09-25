import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowRight,
  Book,
  CalendarClock,
  CheckCircle2,
  Circle,
  Flag,
  GraduationCap,
  Lightbulb,
  ListChecks,
  Map as MapIcon,
  RefreshCw,
  Target,
  Wrench,
} from 'lucide-react'
import { api, getErrorMessage } from '@/api/client'
import { AnalysisListItem, Roadmap as RoadmapData, RoadmapItem } from '@/api/types'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { ChartSkeleton, CardSkeleton } from '@/components/ui/Skeleton'

export function Roadmap() {
  const [analyses, setAnalyses] = useState<AnalysisListItem[]>([])
  const [analysisId, setAnalysisId] = useState<number | 0>(0)
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loadedFor, setLoadedFor] = useState<number | null>(null)

  const completed = useMemo(() => analyses.filter((a) => a.status === 'completed'), [analyses])

  const current = analyses.find((a) => a.id === analysisId)
  const items = roadmap?.items || []
  const byWeek = useMemo(() => {
    const weeks = new Map<number, RoadmapItem[]>()
    for (const item of items) {
      const list = weeks.get(item.week_number) || []
      list.push(item)
      weeks.set(item.week_number, list)
    }
    return [...weeks.entries()].sort((a, b) => a[0] - b[0])
  }, [items])
  const done = items.filter((i) => i.status === 'completed').length

  const loadAnalyses = useCallback(async () => {
    try {
      const { data: res } = await api.get<{ analyses: AnalysisListItem[] }>('/analyses')
      setAnalyses(res.analyses)
      if (!analysisId) {
        const latest = res.analyses.find((a) => a.status === 'completed') || res.analyses[0]
        setAnalysisId(latest?.id || 0)
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [analysisId])

  const loadRoadmap = useCallback(async (id: number) => {
    setLoading(true)
    setError('')
    try {
      const { data: res } = await api.get<RoadmapData>(`/roadmaps/${id}`)
      setRoadmap(res)
      setLoadedFor(id)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAnalyses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (analysisId && analysisId !== loadedFor) loadRoadmap(analysisId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisId])

  const setStatus = async (item: RoadmapItem, status: RoadmapItem['status']) => {
    if (!analysisId) return
    const previous = item.status
    setRoadmap((prev) =>
      prev ? { ...prev, items: prev.items.map((i) => (i.id === item.id ? { ...i, status } : i)) } : prev,
    )
    try {
      const { data: res } = await api.put(`/roadmaps/${analysisId}/items/${item.id}`, { status })
      setRoadmap((prev) =>
        prev ? { ...prev, items: prev.items.map((i) => (i.id === item.id ? { ...i, status: res.status } : i)) } : prev,
      )
      if (res.status === 'completed') toast.success('Nice — item completed!')
    } catch (err) {
      setRoadmap((prev) =>
        prev ? { ...prev, items: prev.items.map((i) => (i.id === item.id ? { ...i, status: previous } : i)) } : prev,
      )
      toast.error(getErrorMessage(err, 'Could not update item.'))
    }
  }

  if (loading && !roadmap) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-6 w-64" />
        <div className="skeleton h-4 w-96 max-w-full" />
        <div className="grid gap-6 lg:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <ChartSkeleton />
      </div>
    )
  }

  if (error && !roadmap) return <ErrorState message={error} onRetry={() => loadAnalyses()} />

  if (completed.length === 0) {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Career Roadmap</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">A 30-day action plan built from your skill gaps.</p>
        </div>
        <EmptyState
          title="No roadmap yet."
          description="Run a career analysis to generate a personalized roadmap that targets your market's most valuable gaps."
          icon={<MapIcon className="h-6 w-6" />}
          action={{ label: 'Analyze My Career', href: '/analyze' }}
        />
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{roadmap?.title || 'Career Roadmap'}</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {roadmap?.duration ?? 30}-day plan · {done}/{items.length} items completed · tick items off as you go.
          </p>
        </div>
        <div className="w-full max-w-xs">
          <Select label="Analysis" value={analysisId} onChange={(e) => setAnalysisId(Number(e.target.value))}>
            {analyses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title || `${a.target_role}${a.location ? ` — ${a.location}` : ''}`} {a.status !== 'completed' ? `(${a.status})` : ''}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {current && current.status !== 'completed' && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
          <RefreshCw className="h-4 w-4 animate-spin" />
          This analysis is still running. Its roadmap appears once complete.
          <Link to={`/analysis/${current.id}`} className="font-semibold underline">Open it →</Link>
        </div>
      )}

      {error && <ErrorState message={error} onRetry={() => analysisId && loadRoadmap(analysisId)} />}

      {roadmap && (
        <>
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">Overall progress</span>
              <span className="text-slate-500">{done}/{items.length}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-surface-800">
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: items.length ? `${(done / items.length) * 100}%` : '0%' }} />
            </div>
          </div>

          <div className="space-y-8">
            {byWeek.map(([week, weekItems]) => (
              <section key={week}>
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">{week}</span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Week {week}</h2>
                  {weekItems.every((i) => i.status === 'completed') && <Badge tone="green">Week complete</Badge>}
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {weekItems.map((item) => (
                    <RoadmapItemCard key={item.id} item={item} onStatus={(status) => setStatus(item, status)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function RoadmapItemCard({ item, onStatus }: { item: RoadmapItem; onStatus: (s: RoadmapItem['status']) => void }) {
  const nextStatus = item.status === 'completed' ? 'pending' : item.status === 'in_progress' ? 'completed' : 'in_progress'
  const nextLabel = item.status === 'completed' ? 'Reset' : item.status === 'in_progress' ? 'Mark complete' : 'Start'
  const done = item.status === 'completed'

  return (
    <div className={`card flex flex-col gap-3 ${done ? 'opacity-80' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button
            onClick={() => onStatus(nextStatus)}
            aria-label={nextLabel}
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
              done
                ? 'border-emerald-500 bg-emerald-500 text-white'
                : item.status === 'in_progress'
                  ? 'border-amber-400 bg-amber-400/20 text-amber-600 dark:text-amber-400'
                  : 'border-slate-300 text-transparent hover:border-brand-400 hover:text-brand-400 dark:border-slate-600'
            }`}
          >
            {done ? <CheckCircle2 className="h-4 w-4" /> : item.status === 'in_progress' ? <Circle className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
          </button>
          <div>
            <h3 className={`text-sm font-semibold ${done ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>{item.title}</h3>
            {item.description && <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{item.description}</p>}
          </div>
        </div>
        <StatusPill status={item.status} />
      </div>

      {item.learning_objective && (
        <DetailsRow icon={<Target className="h-3.5 w-3.5" />} label="Objective" text={item.learning_objective} />
      )}
      {item.why_it_matters && (
        <DetailsRow icon={<Lightbulb className="h-3.5 w-3.5" />} label="Why it matters" text={item.why_it_matters} />
      )}
      {item.what_to_learn && (
        <DetailsRow icon={<GraduationCap className="h-3.5 w-3.5" />} label="What to learn" text={item.what_to_learn} />
      )}
      {item.practice && <DetailsRow icon={<Wrench className="h-3.5 w-3.5" />} label="Practice" text={item.practice} />}
      {item.project_task && <DetailsRow icon={<Flag className="h-3.5 w-3.5" />} label="Project" text={item.project_task} />}
      {item.interview_prep && <DetailsRow icon={<ListChecks className="h-3.5 w-3.5" />} label="Interview prep" text={item.interview_prep} />}

      {item.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.skills.map((s) => (
            <Badge key={s} tone="blue">{s}</Badge>
          ))}
        </div>
      )}

      {item.resources.length > 0 && (
        <details className="group rounded-xl border border-slate-100 px-3 py-2.5 dark:border-slate-800">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Book className="h-3.5 w-3.5" /> Resources & references ({item.resources.length})
            <ArrowRight className="ml-auto h-3.5 w-3.5 transition-transform group-open:rotate-90" />
          </summary>
          <ul className="mt-2 space-y-1.5">
            {item.resources.map((r, i) => (
              <li key={i}>
                {/^https?:\/\//.test(r) ? (
                  <a href={r} target="_blank" rel="noopener noreferrer" className="line-clamp-1 text-xs text-brand-600 hover:underline dark:text-brand-400">{r}</a>
                ) : (
                  <span className="text-xs text-slate-600 dark:text-slate-300">{r}</span>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="mt-auto flex items-center justify-between border-t pt-3">
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <CalendarClock className="h-3.5 w-3.5" /> Week {item.week_number}
        </span>
        <Button
          variant={done ? 'ghost' : 'secondary'}
          size="sm"
          onClick={() => onStatus(nextStatus)}
          className="gap-1"
        >
          {nextLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

function DetailsRow({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-slate-50 px-3 py-2 dark:bg-surface-800">
      <span className="mt-0.5 text-brand-500">{icon}</span>
      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        <span className="font-semibold text-slate-700 dark:text-slate-200">{label}: </span>
        {text}
      </p>
    </div>
  )
}

function StatusPill({ status }: { status: RoadmapItem['status'] }) {
  if (status === 'completed') return <Badge tone="green"><CheckCircle2 className="h-3 w-3" /> Done</Badge>
  if (status === 'in_progress') return <Badge tone="amber">In progress</Badge>
  return <Badge tone="gray">Pending</Badge>
}