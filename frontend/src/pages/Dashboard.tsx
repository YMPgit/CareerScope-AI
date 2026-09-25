import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  Target,
  GitCompareArrows,
  Compass,
  Calendar,
  MapPin,
  Building2,
  Weight,
  Home,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { api, getErrorMessage } from '@/api/client'
import { DashboardResponse } from '@/api/types'
import { useAuth } from '@/context/AuthContext'
import { Card, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton, ChartSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/EmptyState'
import { SkillDemandChart } from '@/components/charts/SkillDemandChart'
import { MatchChart } from '@/components/charts/MatchChart'
import { SkillGapDonut } from '@/components/charts/SkillGapDonut'
import { formatDate, percent } from '@/utils/format'

export function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const { data: res } = await api.get<DashboardResponse>('/dashboard')
      setData(res)
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="skeleton h-7 w-64" />
          <div className="skeleton h-4 w-96 max-w-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={load} />

  if (!data) return null

  const stats = data.stats
  const first = data.profile.full_name.split(' ')[0]
  const marketCounts = data.market_overview?.remote as Record<string, number> | undefined
  const topIndustries = (data.market_overview?.top_industries as Array<{ name: string; count: number }>) || []
  const topSkill = data.skill_demand[0]

  const hasAnyAnalyses = stats.analyses_count > 0

  return (
    <div className="animate-fade-in space-y-6">
      {/* Welcome */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back, {first || 'there'} 👋</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Here's what your career market looks like.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {stats.target_role && (
            <Badge tone="blue">
              <Target className="h-3 w-3" /> {stats.target_role}
            </Badge>
          )}
          {stats.target_location && (
            <Badge tone="cyan">
              <MapPin className="h-3 w-3" /> {stats.target_location}
            </Badge>
          )}
          {stats.last_analysis_date && (
            <Badge tone="gray">
              <Calendar className="h-3 w-3" /> Last analysis {formatDate(stats.last_analysis_date)}
            </Badge>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Jobs analyzed" value={stats.jobs_analyzed} icon={<Briefcase className="h-5 w-5" />} sub="across all your analyses" />
        <StatCard label="Market alignment" value={stats.current_overall_match !== null && stats.current_overall_match !== undefined ? `${Math.round(stats.current_overall_match)}%` : '—'} icon={<Target className="h-5 w-5" />} sub="latest analysis" />
        <StatCard label="Skill gaps" value={stats.skill_gaps_count} icon={<GitCompareArrows className="h-5 w-5" />} sub="missing + partial skills" />
        <StatCard label="Roadmap progress" value={`${Math.round(stats.roadmap_progress)}%`} icon={<Compass className="h-5 w-5" />} sub={stats.roadmap_total_items ? `${stats.roadmap_completed_items}/${stats.roadmap_total_items} items` : 'no roadmap yet'} />
      </div>

      {!hasAnyAnalyses ? (
        <EmptyState
          title="No career analyses yet."
          description="Upload your resume and discover what the market is looking for — the dashboard lights up with live insights."
          icon={<Sparkles className="h-6 w-6" />}
          action={{ label: 'Analyze My Career', href: '/analyze' }}
        />
      ) : (
        <>
          {/* Market overview */}
          <Card>
            <CardHeader title="Job Market Overview" subtitle="Computed from the latest retrieved job dataset" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <MarketMetric icon={<Briefcase className="h-4 w-4" />} label="Live jobs" value={marketCounts ? sumRecord(marketCounts) || (data.market_overview?.total_jobs as number) : undefined} fallback="—" />
              <MarketMetric icon={<TrendingUp className="h-4 w-4" />} label="Top skill" value={topSkill?.name} fallback="—" />
              <MarketMetric icon={<Building2 className="h-4 w-4" />} label="Top industry" value={topIndustries[0]?.name} fallback="—" />
              <MarketMetric icon={<Weight className="h-4 w-4" />} label="Avg. experience" value={data.market_overview?.avg_experience !== undefined && data.market_overview?.avg_experience !== null ? `${data.market_overview.avg_experience} yrs` : undefined} fallback="not stated" />
              <MarketMetric icon={<Home className="h-4 w-4" />} label="Remote jobs" value={marketCounts?.Remote} fallback="—" />
              <MarketMetric icon={<BuildingIcon className="h-4 w-4" />} label="On-site jobs" value={marketCounts?.['On-site']} fallback="—" />
              <MarketMetric icon={<Briefcase className="h-4 w-4" />} label="Hybrid jobs" value={marketCounts?.Hybrid} fallback="—" />
              <MarketMetric icon={<MapPin className="h-4 w-4" />} label="Locations" value={(data.market_overview?.locations as Array<{ location: string; count: number }>)?.length} fallback="—" />
            </div>
          </Card>

          {/* Charts row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Skill Demand" subtitle="Share of live job postings requesting each skill" />
              <SkillDemandChart data={data.skill_demand} />
            </Card>
            <Card>
              <CardHeader title="Resume Match" subtitle="Market demand vs your skills (top 6)" />
              <MatchChart data={data.match_chart} />
            </Card>
          </div>

          {/* Gap + recent */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Skill Gap Distribution" subtitle="How your resume covers demanded skills" />
              <SkillGapDonut distribution={data.gap_distribution} />
            </Card>
            <Card>
              <CardHeader title="Recent analyses" subtitle="Open any previous analysis" action={<Link to="/history" className="text-sm font-medium text-brand-600 hover:underline">View all</Link>} />
              {data.recent_analyses.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">No analyses yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.recent_analyses.slice(0, 5).map((analysis) => (
                    <Link
                      key={analysis.id}
                      to={`/analysis/${analysis.id}`}
                      className="group flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 transition-all hover:border-brand-200 hover:bg-brand-50/50 dark:border-slate-800 dark:hover:border-brand-800 dark:hover:bg-brand-900/20"
                    >
                      <div className="flex items-center gap-4">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                          <Target className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {analysis.target_role}
                            {analysis.location ? ` — ${analysis.location}` : ''}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDate(analysis.created_at)} · {analysis.jobs_count} jobs
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {analysis.overall_match !== null && analysis.overall_match !== undefined && (
                          <Badge tone="green">{percent(analysis.overall_match)} alignment</Badge>
                        )}
                        <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-brand-600" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

function MarketMetric({ icon, label, value, fallback }: { icon: React.ReactNode; label: string; value?: number | string; fallback: string }) {
  const display = value === undefined || value === null || value === '' ? fallback : value
  return (
    <div className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        {icon} {label}
      </div>
      <p className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-white">{display}</p>
    </div>
  )
}

function sumRecord(record: Record<string, number>): number {
  return Object.values(record).reduce((a, b) => a + (b || 0), 0)
}

function BuildingIcon(props: { className?: string }) {
  return <Building2 {...props} />
}