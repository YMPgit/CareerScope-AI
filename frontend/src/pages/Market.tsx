import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  Building2,
  ExternalLink,
  Globe,
  Home,
  MapPin,
  PieChart,
  RefreshCw,
  TrendingUp,
  Weight,
} from 'lucide-react'
import { api, getErrorMessage } from '@/api/client'
import { AnalysisListItem, Job, MarketResponse, MarketSkill } from '@/api/types'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { JobCard } from '@/components/cards/JobCard'
import { Select } from '@/components/ui/Input'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { ChartSkeleton, CardSkeleton } from '@/components/ui/Skeleton'
import { SkillDemandChart } from '@/components/charts/SkillDemandChart'

export function Market() {
  const [analyses, setAnalyses] = useState<AnalysisListItem[]>([])
  const [analysisId, setAnalysisId] = useState<number | 0>(0)
  const [data, setData] = useState<MarketResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loadedFor, setLoadedFor] = useState<number | null>(null)

  const completed = useMemo(() => analyses.filter((a) => a.status === 'completed'), [analyses])

  const loadAnalyses = async () => {
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
  }

  const loadMarket = async (id: number) => {
    setLoading(true)
    setError('')
    try {
      const { data: res } = await api.get<MarketResponse>(`/market/${id}`)
      setData(res)
      setLoadedFor(id)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalyses()
  }, [])

  useEffect(() => {
    if (analysisId && analysisId !== loadedFor) loadMarket(analysisId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisId])

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-6 w-64" />
        <div className="skeleton h-4 w-96 max-w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <ChartSkeleton />
      </div>
    )
  }

  if (error && !data) return <ErrorState message={error} onRetry={() => loadAnalyses()} />

  const current = analyses.find((a) => a.id === analysisId)

  if (completed.length === 0) {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Market Intelligence</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Live job-market data for a target role.</p>
        </div>
        <EmptyState
          title="No completed analyses yet."
          description="Run an analysis to produce live market intelligence for a role and location."
          icon={<PieChart className="h-6 w-6" />}
          action={{ label: 'Analyze My Career', href: '/analyze' }}
        />
      </div>
    )
  }

  const ov = (data?.market_stats ?? {}) as Record<string, unknown>
  const jobs = data?.jobs || []

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Market Intelligence</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Live data from Google Jobs, computed every time you analyze.</p>
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
          This analysis is still running. Results appear live on its detail page.
          <Link to={`/analysis/${current.id}`} className="font-semibold underline">Open it →</Link>
        </div>
      )}

      {error && <ErrorState message={error} onRetry={() => analysisId && loadMarket(analysisId)} />}

      {data && data.status === 'completed' && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric icon={<Briefcase className="h-4 w-4" />} label="Jobs analyzed" value={num(ov.total_jobs)} />
            <Metric icon={<TrendingUp className="h-4 w-4" />} label="Processed" value={num(ov.processed_jobs)} />
            <Metric icon={<Weight className="h-4 w-4" />} label="Avg. experience" value={ov.avg_experience != null ? `${ov.avg_experience} yrs` : 'Not stated'} />
            <Metric icon={<Home className="h-4 w-4" />} label="Remote postings" value={num(remoteOf(ov)?.Remote)} />
          </div>

          <Card>
            <CardHeader title="Skill demand" subtitle="Share of live job postings requesting each skill" />
            <SkillDemandChart data={(ov.top_skills as MarketSkill[]) || []} />
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Work mode & employment" />
              <div className="space-y-4">
                <CountGrid title="Work mode" counts={remoteOf(ov) || {}} fallbackKeys={['Remote', 'Hybrid', 'On-site', 'Unknown']} />
                <CountGrid title="Employment type" counts={(ov.employment_types as Record<string, number>) || {}} />
                <CountGrid title="Experience level" counts={(ov.experience_distribution as Record<string, number>) || {}} />
              </div>
            </Card>
            <div className="space-y-6">
              <Card>
                <CardHeader title="Top hiring companies" />
                <RankList rows={(ov.top_companies as Array<{ name: string; count: number }>) || []} />
              </Card>
              <Card>
                <CardHeader title="Top industries" />
                <RankList rows={(ov.top_industries as Array<{ name: string; count: number }>) || []} />
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader title="Locations" />
            <RankList rows={(ov.locations as Array<{ location: string; count: number }>) || []} location />
          </Card>

          {(ov.salary as { mentioned: number; examples: string[] } | null)?.examples?.length ? (
            <Card>
              <CardHeader title="Salary signals" subtitle={`Mentioned in ${(ov.salary as { mentioned: number }).mentioned} postings`} />
              <div className="flex flex-wrap gap-1.5">
                {((ov.salary as { examples: string[] }).examples || []).map((ex, i) => (
                  <Badge key={i} tone="green">{ex}</Badge>
                ))}
              </div>
            </Card>
          ) : null}

          <Card>
            <CardHeader title={`Live jobs (${jobs.length})`} subtitle="Sorted by relevance from Google Jobs" />
            {jobs.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No job postings retrieved for this search.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {jobs.map((job: Job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </Card>

          {(data.sources || []).length > 0 && (
            <Card>
              <CardHeader title="Data sources" />
              <div className="grid gap-3 md:grid-cols-2">
                {data.sources.map((s, i) => (
                  <div key={i} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                        <Globe className="h-4 w-4 text-brand-500" /> {s.label || s.source_type}
                      </p>
                      {typeof s.count === 'number' && <Badge tone="gray">{s.count} results</Badge>}
                    </div>
                    {s.url && (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-brand-600 hover:underline dark:text-brand-400">
                        Open search <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">{icon} {label}</div>
      <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}

function remoteOf(ov: Record<string, unknown>): Record<string, number> | undefined {
  const r = ov.remote
  return r && typeof r === 'object' ? (r as Record<string, number>) : undefined
}

function CountGrid({ title, counts, fallbackKeys }: { title: string; counts: Record<string, number>; fallbackKeys?: string[] }) {
  const keys = fallbackKeys ? fallbackKeys.filter((k) => counts[k] !== undefined) : Object.keys(counts)
  if (keys.length === 0) return null
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h4>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {keys.map((k) => (
          <div key={k} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-surface-800">
            <span className="text-slate-600 dark:text-slate-300">{k}</span>
            <span className="font-bold text-slate-900 dark:text-white">{counts[k]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RankList({ rows, location }: { rows: Array<{ name?: string; location?: string; count: number }>; location?: boolean }) {
  if (!rows || rows.length === 0) {
    return <p className="py-3 text-sm text-slate-400">No data retrieved.</p>
  }
  return (
    <div className="space-y-1.5">
      {rows.map((row) => {
        const label = row.name ?? row.location ?? 'Unknown'
        return (
          <div key={label} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              {location ? <MapPin className="h-3.5 w-3.5 text-brand-500" /> : <Building2 className="h-3.5 w-3.5 text-brand-500" />}
              {label}
            </span>
            <Badge tone="gray">{row.count}</Badge>
          </div>
        )
      })}
    </div>
  )
}

function num(v: unknown): number {
  return typeof v === 'number' ? v : 0
}