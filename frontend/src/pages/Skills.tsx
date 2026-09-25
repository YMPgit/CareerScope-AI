import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GitCompareArrows, RefreshCw, Sparkles, UserRound } from 'lucide-react'
import { api, getErrorMessage } from '@/api/client'
import { AnalysisListItem, MarketSkill, SkillsResponse } from '@/api/types'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SkillBar } from '@/components/SkillBar'
import { Select } from '@/components/ui/Input'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { ChartSkeleton, CardSkeleton } from '@/components/ui/Skeleton'
import { SkillGapDonut } from '@/components/charts/SkillGapDonut'

export function Skills() {
  const [analyses, setAnalyses] = useState<AnalysisListItem[]>([])
  const [analysisId, setAnalysisId] = useState<number | 0>(0)
  const [data, setData] = useState<SkillsResponse | null>(null)
  const [filter, setFilter] = useState<'all' | 'strong' | 'partial' | 'missing'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loadedFor, setLoadedFor] = useState<number | null>(null)

  const completed = useMemo(() => analyses.filter((a) => a.status === 'completed'), [analyses])
  const sorted = useMemo(() => {
    if (!data) return []
    const order = { high: 0, medium: 1, low: 2 }
    return [...data.skills].sort((a, b) => order[a.priority] - order[b.priority] || b.market_percentage - a.market_percentage)
  }, [data])

  const visible = filter === 'all' ? sorted : sorted.filter((s) => s.skill_gap_level === filter)

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

  const loadSkills = async (id: number) => {
    setLoading(true)
    setError('')
    try {
      const { data: res } = await api.get<SkillsResponse>(`/skills/${id}`)
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
    if (analysisId && analysisId !== loadedFor) loadSkills(analysisId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisId])

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-6 w-64" />
        <div className="skeleton h-4 w-96 max-w-full" />
        <div className="grid gap-6 lg:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <ChartSkeleton />
      </div>
    )
  }

  if (error && !data) return <ErrorState message={error} onRetry={() => loadAnalyses()} />

  if (completed.length === 0) {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Skill Intelligence</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Your skills vs. what the market demands.</p>
        </div>
        <EmptyState
          title="No completed analyses yet."
          description="Run an analysis to compare your skills with live market demand."
          icon={<GitCompareArrows className="h-6 w-6" />}
          action={{ label: 'Analyze My Career', href: '/analyze' }}
        />
      </div>
    )
  }

  const current = analyses.find((a) => a.id === analysisId)

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Skill Intelligence</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Demanded skills your resume ignores → plan to close them.</p>
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

      {error && <ErrorState message={error} onRetry={() => analysisId && loadSkills(analysisId)} />}

      {data && data.status === 'completed' && (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader title="Coverage distribution" subtitle="How demanded skills split across your resume" />
              <SkillGapDonut distribution={data.gap_distribution} />
            </Card>
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader title="Your resume skills" subtitle="Extracted only from your actual resume text" />
                {data.resume_skills.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">No skills were detected in the resume.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {data.resume_skills.map((s) => (
                      <Badge key={s} tone="green"><UserRound className="h-3 w-3" /> {s}</Badge>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>

          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Skill comparison <span className="text-slate-400">· {visible.length} of {data.skills.length}</span>
                </h3>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Prioritized: high-priority gaps first, by market demand.</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(['all', 'strong', 'partial', 'missing'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                      filter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-surface-800 dark:text-slate-300'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            {visible.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">Nothing matches this filter.</p>
            ) : (
              <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
                {visible.map((skill: MarketSkill) => (
                  <div key={skill.name}>
                    <SkillBar skill={skill} max={Math.max(...data.skills.map((s) => s.market_percentage))} />
                    {skill.reason && <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{skill.reason}</p>}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="flex items-center gap-2 rounded-xl bg-brand-50 p-4 text-sm text-brand-800 dark:bg-brand-900/20 dark:text-brand-200">
            <Sparkles className="h-4 w-4 shrink-0" />
            Use the <Link to="/roadmap" className="font-semibold underline">roadmap</Link> to turn these gaps into a concrete 30-day plan of what to learn, build and practice.
          </div>
        </>
      )}
    </div>
  )
}