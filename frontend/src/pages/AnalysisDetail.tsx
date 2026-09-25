import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Target,
  MapPin,
  Calendar,
  Briefcase,
  Sparkles,
  RefreshCw,
  Pencil,
  Trash2,
  Building2,
  Home,
  TrendingUp,
  Weight,
  FileText,
  ExternalLink,
  Search,
  Newspaper,
  CheckCircle2,
  Lightbulb,
  AlertTriangle,
  Rocket,
} from 'lucide-react'
import { api, getErrorMessage } from '@/api/client'
import { AnalysisDetail as AnalysisDetailType, Job, Roadmap, MarketSkill } from '@/api/types'
import { usePolling } from '@/hooks/usePolling'
import { ProgressSteps } from '@/components/ProgressSteps'
import { GaugeCard } from '@/components/GaugeCard'
import { SkillBar } from '@/components/SkillBar'
import { JobCard } from '@/components/cards/JobCard'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { ChartSkeleton, CardSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/EmptyState'
import { formatDateTime, stageLabel } from '@/utils/format'

const STAGE_LABELS: Record<string, string> = {
  queued: 'Queued your analysis',
  manager: 'Initializing',
  resume_analyzer: 'Analyzing your resume',
  job_market: 'Searching live jobs on Google Jobs',
  skill_intelligence: 'Extracting market skill demand',
  skill_gap: 'Comparing your skills with the market',
  career_planner: 'Building your career roadmap',
  insight: 'Writing your personalized report',
  persist: 'Saving your results',
}

export function AnalysisDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [renaming, setRenaming] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [rerunning, setRerunning] = useState(false)
  const [jobs, setJobs] = useState<Job[] | null>(null)

  const { data, error, loading } = usePolling<AnalysisDetailType>(
    async () => {
      const { data: res } = await api.get<AnalysisDetailType>(`/analyses/${id}`)
      return res
    },
    2500,
    true,
    [id],
  )

  const analysis = data
  const inProgress = analysis?.status === 'queued' || analysis?.status === 'processing'
  const failed = analysis?.status === 'failed'
  const completed = analysis?.status === 'completed'

  const displayedJobs = jobs ?? analysis?.jobs ?? []

  if (loading && !analysis) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-6 w-2/3" />
        <div className="skeleton h-4 w-1/2" />
        <div className="grid gap-6 lg:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <ChartSkeleton />
      </div>
    )
  }

  if (error && !analysis) return <ErrorState message={getErrorMessage(error)} onRetry={() => window.location.reload()} />
  if (!analysis) return null

  const rename = async () => {
    const input = document.getElementById('rename-title') as HTMLInputElement | null
    const title = input?.value.trim()
    if (!title) return
    try {
      await api.patch(`/analyses/${analysis.id}`, { title })
      toast.success('Analysis renamed')
      setRenaming(false)
      window.location.reload()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const doDelete = async () => {
    try {
      await api.delete(`/analyses/${analysis.id}`)
      toast.success('Analysis deleted')
      navigate('/history')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const rerun = async () => {
    setRerunning(true)
    try {
      const { data: res } = await api.post(`/analyses/${analysis.id}/rerun`)
      toast.success('Analysis re-running with fresh market data')
      navigate(`/analysis/${res.analysis.id}`, { replace: true })
    } catch (err) {
      setRerunning(false)
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link to="/history" className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-600 dark:text-slate-400">
              <ArrowLeft className="h-4 w-4" /> Back to history
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{analysis.title || analysis.target_role}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone="blue">
                <Target className="h-3 w-3" /> {analysis.target_role}
              </Badge>
              {analysis.location && (
                <Badge tone="cyan">
                  <MapPin className="h-3 w-3" /> {analysis.location}
                </Badge>
              )}
              {analysis.experience_level && analysis.experience_level !== 'Any' && <Badge tone="purple">{analysis.experience_level}</Badge>}
              {analysis.created_at && (
                <Badge tone="gray">
                  <Calendar className="h-3 w-3" /> {formatDateTime(analysis.created_at)}
                </Badge>
              )}
              <StatusBadge status={analysis.status} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={<Pencil className="h-4 w-4" />} onClick={() => setRenaming(true)}>
              Rename
            </Button>
            <Button variant="secondary" icon={<RefreshCw className="h-4 w-4" />} loading={rerunning} onClick={rerun}>
              Re-run
            </Button>
            <Button variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          </div>
        </div>
      </div>

      {inProgress && (
        <Card>
          <CardHeader title="Analyzing live market…" subtitle="Your career agents are working. This page refreshes automatically." />
          <div className="mb-6">
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">{stageLabel(analysis.current_stage)}</span>
              <span className="text-slate-500">{Math.round(analysis.progress)}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-surface-800">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-700" style={{ width: `${Math.min(analysis.progress, 100)}%` }} />
            </div>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <ProgressSteps completed={analysis.completed_stages} current={analysis.current_stage} />
            <div className="flex flex-col justify-center rounded-xl bg-brand-50/60 p-6 dark:bg-brand-900/20">
              <p className="flex items-center gap-2 text-sm font-semibold text-brand-700 dark:text-brand-300">
                <Sparkles className="h-4 w-4" /> How it works
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                We're pulling live job postings for <strong>{analysis.target_role}</strong>
                {analysis.location ? ` in ${analysis.location}` : ''}, computing objective demand statistics, then reasoning over
                your resume to build recommendations with evidence.
              </p>
            </div>
          </div>
        </Card>
      )}

      {failed && (
        <Card>
          <CardHeader title="This analysis failed" subtitle="Something went wrong while collecting live data." />
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            <p className="font-semibold">Reason</p>
            <p className="mt-1 whitespace-pre-wrap">{analysis.error_message || 'Unknown error.'}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button icon={<RefreshCw className="h-4 w-4" />} loading={rerunning} onClick={rerun}>
              Retry analysis
            </Button>
            <Button variant="secondary" onClick={() => navigate('/analyze')}>New analysis</Button>
          </div>
        </Card>
      )}

      {completed && (
        <>
          <GaugeCard score={analysis.overall_match} explanation={analysis.insights?.score_explanation} />

          {analysis.summary && (
            <Card>
              <CardHeader title="Executive Summary" subtitle="Written for you by the agent team" />
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">{analysis.summary}</p>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {analysis.insights?.strengths && analysis.insights.strengths.length > 0 && (
              <InsightCard title="Your strengths" subtitle="What your resume already covers well" icon={<CheckCircle2 className="h-4 w-4" />} items={analysis.insights.strengths} tone="green" />
            )}
            {analysis.insights?.critical_gaps && analysis.insights.critical_gaps.length > 0 && (
              <InsightCard title="Critical gaps" subtitle="What the market rewards that you're missing" icon={<AlertTriangle className="h-4 w-4" />} items={analysis.insights.critical_gaps} tone="red" />
            )}
            {analysis.insights?.opportunities && analysis.insights.opportunities.length > 0 && (
              <InsightCard title="Market opportunities" subtitle="Who's hiring and what they want" icon={<Lightbulb className="h-4 w-4" />} items={analysis.insights.opportunities} tone="amber" />
            )}
            {analysis.insights?.next_steps && analysis.insights.next_steps.length > 0 && (
              <InsightCard title="Next steps" subtitle="Start here to close the biggest gaps" icon={<Rocket className="h-4 w-4" />} items={analysis.insights.next_steps} tone="blue" />
            )}
          </div>

          <MarketOverviewPanel analysis={analysis} />
          <ResumePanel analysis={analysis} />

          <Card>
            <CardHeader
              title="Market alignment by skill"
              subtitle="How your resume compares with live demand"
              action={<Link to="/skills" className="text-sm font-medium text-brand-600 hover:underline">Full skill analysis →</Link>}
            />
            {analysis.skills.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No skills analyzed yet.</p>
            ) : (
              <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
                {analysis.skills.slice(0, 12).map((skill) => (
                  <SkillBar key={skill.name} skill={skill} max={Math.max(...analysis.skills.map((s) => s.market_percentage))} />
                ))}
              </div>
            )}
          </Card>

          <RoadmapPanel roadmap={analysis.roadmap} />

          <Card>
            <CardHeader
              title={`Live jobs found (${analysis.jobs.length})`}
              subtitle="Retrieved from Google Jobs · save the ones you like"
              action={<Link to="/market" className="text-sm font-medium text-brand-600 hover:underline">Open market view →</Link>}
            />
            {analysis.jobs.length === 0 ? (
              <EmptyState title="No jobs retrieved" description="Try re-running the analysis to pull the latest postings." icon={<Briefcase className="h-6 w-6" />} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {displayedJobs.map((job) => (
                  <JobCard key={job.id} job={job} onToggleSave={(jobId, saved) => setJobs((prev) => (prev ?? analysis.jobs).map((j) => (j.id === jobId ? { ...j, is_saved: saved } : j)))} />
                ))}
              </div>
            )}
          </Card>

          {analysis.sources.length > 0 && <SourcesPanel sources={analysis.sources} />}
        </>
      )}

      <Modal open={renaming} onClose={() => setRenaming(false)} title="Rename analysis">
        <Input id="rename-title" label="Title" defaultValue={analysis.title || analysis.target_role} onKeyDown={(e) => e.key === 'Enter' && rename()} />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setRenaming(false)}>Cancel</Button>
          <Button onClick={rename}>Save</Button>
        </div>
      </Modal>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this analysis?">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This permanently deletes the analysis, its market data and roadmap. Saved jobs and your resume are kept.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button variant="danger" onClick={doDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'completed') return <Badge tone="green">Completed</Badge>
  if (status === 'failed') return <Badge tone="red">Failed</Badge>
  return <Badge tone="amber">Processing</Badge>
}

function InsightCard({ title, subtitle, icon, items, tone }: { title: string; subtitle: string; icon: React.ReactNode; items: string[]; tone: 'green' | 'red' | 'amber' | 'blue' }) {
  const iconColor: Record<string, string> = {
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
    blue: 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300',
  }
  const dotColor: Record<string, string> = {
    green: 'bg-emerald-400',
    red: 'bg-red-400',
    amber: 'bg-amber-400',
    blue: 'bg-brand-400',
  }
  return (
    <Card className="h-full">
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconColor[tone]}`}>{icon}</span>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotColor[tone]}`} />
            {item}
          </li>
        ))}
      </ul>
    </Card>
  )
}

function MarketOverviewPanel({ analysis }: { analysis: AnalysisDetailType }) {
  const ov = analysis.market_overview || analysis.market_stats || {}
  const jobsCount = (ov as any)?.total_jobs ?? analysis.jobs.length
  const topSkills = ((ov as any)?.top_skills || []) as MarketSkill[]
  const topCompanies = ((ov as any)?.top_companies || []) as Array<{ name: string; count: number }>
  const topIndustries = ((ov as any)?.top_industries || []) as Array<{ name: string; count: number }>
  const remote = ((ov as any)?.remote || {}) as Record<string, number>
  const employment = ((ov as any)?.employment_types || {}) as Record<string, number>
  const expDist = ((ov as any)?.experience_distribution || {}) as Record<string, number>
  const avgExp = (ov as any)?.avg_experience as number | null | undefined
  const salary = (ov as any)?.salary as { mentioned: number; examples: string[] } | null | undefined

  return (
    <Card>
      <CardHeader title="Live Market Overview" subtitle={`Computed from ${jobsCount} retrieved job postings`} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Metric icon={<Briefcase className="h-4 w-4" />} label="Jobs analyzed" value={jobsCount} />
        <Metric icon={<Home className="h-4 w-4" />} label="Remote" value={remote?.Remote ?? 0} />
        <Metric icon={<Building2 className="h-4 w-4" />} label="On-site" value={remote?.['On-site'] ?? 0} />
        <Metric icon={<TrendingUp className="h-4 w-4" />} label="Hybrid" value={remote?.Hybrid ?? 0} />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {topSkills.length > 0 && (
          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Top demanded skills</h4>
            <div className="grid gap-3 md:grid-cols-2">
              {topSkills.map((s) => (
                <div key={s.name} className="rounded-xl border border-slate-100 px-3 py-2 dark:border-slate-800">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.market_percentage}% of job postings</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-4">
          {topCompanies.length > 0 && (
            <TagCloud label="Top hiring companies" rows={topCompanies} />
          )}
          {topIndustries.length > 0 && (
            <TagCloud label="Top industries" rows={topIndustries} />
          )}
          {Object.keys(employment).length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Employment types</h4>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(employment).map(([k, v]) => (
                  <Badge key={k} tone="gray">{k}: {v}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(avgExp !== undefined && avgExp !== null) && <Metric icon={<Weight className="h-4 w-4" />} label="Avg. experience" value={`${avgExp} yrs`} />}
        {salary && <Metric icon={<FileText className="h-4 w-4" />} label="Salary mentioned" value={`${salary.mentioned} postings`} />}
        {Object.keys(expDist).length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold">Experience levels</h4>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(expDist).map(([k, v]) => (
                <Badge key={k} tone="cyan">{k}: {v}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {salary && salary.examples.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Salary examples spotted</h4>
          <div className="flex flex-wrap gap-1.5">
            {salary.examples.map((ex, i) => (
              <Badge key={i} tone="green">{ex}</Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

function TagCloud({ label, rows }: { label: string; rows: Array<{ name: string; count: number }> }) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</h4>
      <div className="flex flex-wrap gap-1.5">
        {rows.map((r) => (
          <Badge key={r.name} tone="blue">{r.name} <span className="opacity-70">· {r.count}</span></Badge>
        ))}
      </div>
    </div>
  )
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">{icon} {label}</div>
      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}

function ResumePanel({ analysis }: { analysis: AnalysisDetailType }) {
  const parsed = analysis.resume?.parsed_data
  const sections: Array<{ key: keyof NonNullable<typeof parsed>; label: string }> = [
    { key: 'skills', label: 'Skills' },
    { key: 'tools', label: 'Tools' },
    { key: 'education', label: 'Education' },
    { key: 'projects', label: 'Projects' },
    { key: 'certifications', label: 'Certifications' },
  ]
  return (
    <Card>
      <CardHeader
        title="Your resume at a glance"
        subtitle={analysis.resume?.file_name ? `Extracted from ${analysis.resume.file_name}` : 'Resume snapshot'}
      />
      <div className="space-y-4">
        {sections.map(({ key, label }) => {
          const items = (parsed?.[key] || []) as string[]
          if (items.length === 0) return null
          return (
            <div key={key}>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</h4>
              <div className="flex flex-wrap gap-1.5">
                {items.map((item) => (
                  <Badge key={item} tone="gray">{item}</Badge>
                ))}
              </div>
            </div>
          )
        })}
        {parsed?.summary && <p className="text-sm italic leading-relaxed text-slate-500 dark:text-slate-400">“{parsed.summary}”</p>}
      </div>
    </Card>
  )
}

function RoadmapPanel({ roadmap }: { roadmap?: Roadmap | null }) {
  if (!roadmap) return null
  const completedItems = roadmap.items.filter((i) => i.status === 'completed').length
  return (
    <Card>
      <CardHeader
        title={roadmap.title || 'Your 30-day career roadmap'}
        subtitle={`${roadmap.duration} days · ${completedItems}/${roadmap.items.length} items done`}
        action={<Link to="/roadmap" className="text-sm font-medium text-brand-600 hover:underline">Open roadmap →</Link>}
      />
      <div className="space-y-3">
        {roadmap.items.slice(0, 5).map((item) => (
          <div key={item.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
            <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              item.status === 'completed' ? 'bg-emerald-500 text-white' : item.status === 'in_progress' ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-600 dark:bg-surface-800 dark:text-slate-300'
            }`}>
              {item.week_number}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
              {item.description && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{item.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function SourcesPanel({ sources }: { sources: AnalysisDetailType['sources'] }) {
  return (
    <Card>
      <CardHeader
        title="Data sources & evidence"
        subtitle="Every number is backed by the original postings and articles behind it"
        action={<span className="text-xs font-medium text-slate-400">{sources.length} sources</span>}
      />
      <div className="grid max-h-[26rem] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
        {sources.map((s, i) => {
          const evidence = s.links || []
          const shown = evidence.length > 0 ? Math.min(evidence.length, typeof s.count === 'number' ? s.count : evidence.length) : s.count
          return (
            <div key={i} className="flex flex-col rounded-xl border border-slate-100 p-3 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {sourceIcon(s.source_type)}
                  {s.label || s.source_type}
                </p>
                {typeof shown === 'number' && <Badge tone="gray">{shown} result{shown === 1 ? '' : 's'}</Badge>}
              </div>
              {s.query && <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Query: {s.query}</p>}
              {s.url && (
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-brand-600 hover:underline dark:text-brand-400">
                  Open search <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {evidence.length > 0 && (
                <p className="mt-3 mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Evidence
                </p>
              )}
              {evidence.length > 0 && (
                <ul className="max-h-44 space-y-1 overflow-y-auto pr-1">
                  {evidence.map((link, j) => (
                    <li key={j}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-start gap-2 rounded-lg px-1.5 py-1.5 hover:bg-slate-50 dark:hover:bg-surface-800"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-medium text-slate-700 group-hover:text-brand-600 dark:text-slate-200 dark:group-hover:text-brand-400">
                            {link.title || link.url}
                          </span>
                          <span className="block truncate text-[11px] text-slate-400 dark:text-slate-500">
                            {link.company ? `${link.company} · ` : ''}
                            {hostOf(link.url)}
                          </span>
                        </span>
                        <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-slate-300 group-hover:text-brand-500 dark:text-slate-600" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function sourceIcon(type?: string) {
  if (type === 'google_jobs') return <Briefcase className="h-4 w-4 shrink-0 text-brand-500" />
  if (type === 'google_news') return <Newspaper className="h-4 w-4 shrink-0 text-brand-500" />
  return <Search className="h-4 w-4 shrink-0 text-brand-500" />
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url.split('/')[0] || url
  }
}