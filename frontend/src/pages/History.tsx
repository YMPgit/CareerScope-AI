import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowRight,
  Briefcase,
  Calendar,
  Check,
  History as HistoryIcon,
  Loader2,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Target,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react'
import { api, getErrorMessage } from '@/api/client'
import { AnalysisListItem } from '@/api/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { formatDateTime, percent } from '@/utils/format'

export function History() {
  const [analyses, setAnalyses] = useState<AnalysisListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [menuId, setMenuId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get<{ analyses: AnalysisListItem[] }>('/analyses')
      setAnalyses(data.analyses)
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const totals = useMemo(() => {
    const completed = analyses.filter((a) => a.status === 'completed').length
    const jobs = analyses.reduce((sum, a) => sum + (a.jobs_count || 0), 0)
    const failed = analyses.filter((a) => a.status === 'failed').length
    return { total: analyses.length, completed, jobs, failed }
  }, [analyses])

  const startRename = (a: AnalysisListItem) => {
    setEditingId(a.id)
    setEditingValue(a.title || a.target_role)
    setMenuId(null)
  }

  const saveRename = async () => {
    if (editingId === null) return
    const title = editingValue.trim()
    if (!title) return
    setBusyId(editingId)
    try {
      await api.patch(`/analyses/${editingId}`, { title })
      toast.success('Renamed')
      setEditingId(null)
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const rerun = async (a: AnalysisListItem) => {
    setBusyId(a.id)
    try {
      const { data } = await api.post(`/analyses/${a.id}/rerun`)
      toast.success('A fresh analysis is now queued')
      setMenuId(null)
      window.location.href = `/analysis/${data.analysis.id}`
    } catch (err) {
      toast.error(getErrorMessage(err))
      setBusyId(null)
    }
  }

  const remove = async (a: AnalysisListItem) => {
    if (!window.confirm(`Delete the analysis "${a.title || a.target_role}"? This cannot be undone.`)) {
      setMenuId(null)
      return
    }
    setBusyId(a.id)
    try {
      await api.delete(`/analyses/${a.id}`)
      toast.success('Analysis deleted')
      setMenuId(null)
      setAnalyses((prev) => prev.filter((x) => x.id !== a.id))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  if (loading && analyses.length === 0) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-6 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <CardSkeleton />
      </div>
    )
  }

  if (error && analyses.length === 0) return <ErrorState message={error} onRetry={load} />

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analysis History</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Every career analysis you've run, saved forever.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard icon={<HistoryIcon className="h-4 w-4" />} label="Total analyses" value={totals.total} />
        <SummaryCard icon={<Check className="h-4 w-4" />} label="Completed" value={totals.completed} tone="green" />
        <SummaryCard icon={<TrendingUp className="h-4 w-4" />} label="Jobs captured" value={totals.jobs} tone="blue" />
      </div>

      {analyses.length === 0 ? (
        <EmptyState
          title="No analyses yet."
          description="Run your first analysis to see live market intelligence and your personalized roadmap."
          icon={<Briefcase className="h-6 w-6" />}
          action={{ label: 'Analyze My Career', href: '/analyze' }}
        />
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {analyses.map((a) => (
              <li key={a.id} className="relative flex flex-wrap items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-surface-800/50">
                {/* Row content */}
                <Link to={`/analysis/${a.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                  <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 sm:flex dark:bg-brand-900/40 dark:text-brand-300">
                    <Target className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    {editingId === a.id ? (
                      <div className="flex items-center gap-2">
                        <Input value={editingValue} onChange={(e) => setEditingValue(e.target.value)} autoFocus className="w-64 sm:w-80" />
                        <Button size="sm" onClick={saveRename} loading={busyId === a.id}><Check className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5" /></Button>
                      </div>
                    ) : (
                      <>
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {a.title || `${a.target_role}${a.location ? ` — ${a.location}` : ''}`}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDateTime(a.created_at)}</span>
                          {a.jobs_count > 0 && <span>{a.jobs_count} jobs</span>}
                          {a.overall_match !== null && a.overall_match !== undefined && (
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">{percent(a.overall_match)} match</span>
                          )}
                        </p>
                      </>
                    )}
                  </div>
                  {editingId !== a.id && (
                    <>
                      <StatusBadge status={a.status} progress={a.progress} />

                      {a.status === 'completed' && a.overall_match !== null && a.overall_match !== undefined && (
                        <span className="hidden w-14 text-right text-sm font-bold text-slate-900 sm:block dark:text-white">{Math.round(a.overall_match)}%</span>
                      )}

                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          setMenuId((prev) => (prev === a.id ? null : a.id))
                        }}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-surface-800"
                        aria-label="Actions"
                      >
                        {busyId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-5 w-5" />}
                      </button>
                    </>
                  )}
                </Link>

                {menuId === a.id && (
                  <div className="absolute right-12 top-full z-10 mt-1 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-surface-800">
                    <Link to={`/analysis/${a.id}`} className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-surface-700">
                      <span className="flex items-center gap-2"><ArrowRight className="h-4 w-4" /> Open</span>
                    </Link>
                    <button onClick={() => startRename(a)} className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-surface-700">
                      <span className="flex items-center gap-2"><Pencil className="h-4 w-4" /> Rename</span>
                    </button>
                    <button onClick={() => rerun(a)} className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-surface-700">
                      <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Re-run</span>
                    </button>
                    <button onClick={() => remove(a)} className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
                      <span className="flex items-center gap-2"><Trash2 className="h-4 w-4" /> Delete</span>
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function SummaryCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone?: 'green' | 'blue' }) {
  const color =
    tone === 'green'
      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300'
      : tone === 'blue'
        ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300'
        : 'bg-slate-100 text-slate-600 dark:bg-surface-800 dark:text-slate-300'
  return (
    <div className="card flex items-center gap-3">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>{icon}</span>
      <div>
        <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  )
}

function StatusBadge({ status, progress }: { status: string; progress: number }) {
  if (status === 'completed') return <Badge tone="green">Completed</Badge>
  if (status === 'failed') return <Badge tone="red">Failed</Badge>
  return (
    <Badge tone="amber">
      <span className="flex items-center gap-1.5">
        <Loader2 className="h-3 w-3 animate-spin" />
        {Math.round(progress)}%
      </span>
    </Badge>
  )
}