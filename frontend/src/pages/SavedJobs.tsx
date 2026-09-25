import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Bookmark, Briefcase, Search, SearchX } from 'lucide-react'
import { api, getErrorMessage } from '@/api/client'
import { SavedJobsResponse } from '@/api/types'
import { Card } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { JobCard } from '@/components/cards/JobCard'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { WORK_MODES } from '@/utils/format'

export function SavedJobs() {
  const [entries, setEntries] = useState<SavedJobsResponse['saved_jobs']>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [employmentType, setEmploymentType] = useState('Any')
  const [appliedQuery, setAppliedQuery] = useState({ query: '', location: '', employmentType: 'Any' })
  const [debounce, setDebounce] = useState<ReturnType<typeof setTimeout> | null>(null)

  const load = async (filters?: typeof appliedQuery) => {
    setLoading(true)
    const f = filters ?? appliedQuery
    try {
      const params: Record<string, string> = {}
      if (f.query) params.query = f.query
      if (f.location) params.location = f.location
      if (f.employmentType && f.employmentType !== 'Any') params.employment_type = f.employmentType
      const { data } = await api.get<SavedJobsResponse>('/saved-jobs', { params })
      setEntries(data.saved_jobs)
      setTotal(data.total)
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (debounce) clearTimeout(debounce)
    const t = setTimeout(() => setAppliedQuery({ query, location, employmentType }), 350)
    setDebounce(t)
    return () => {
      if (debounce) clearTimeout(debounce)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, location, employmentType])

  useEffect(() => {
    if (appliedQuery) load(appliedQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedQuery])

  const onToggleSave = (jobId: number, saved: boolean) => {
    if (!saved) {
      setEntries((prev) => prev.filter((e) => e.job.id !== jobId))
      setTotal((prev) => Math.max(0, prev - 1))
    }
  }

  const clearFilters = () => {
    setQuery('')
    setLocation('')
    setEmploymentType('Any')
  }

  const hasFilters = Boolean(query || location || employmentType !== 'Any')

  if (loading && entries.length === 0 && total === 0 && !error) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-6 w-48" />
        <div className="skeleton h-4 w-96 max-w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (error && entries.length === 0) return <ErrorState message={error} onRetry={() => load()} />

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Saved Jobs</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">{total} saved job{total === 1 ? '' : 's'} from your analyses.</p>
      </div>

      <Card>
        <div className="grid gap-4 md:grid-cols-4">
          <Input placeholder="Search by title…" value={query} onChange={(e) => setQuery(e.target.value)} icon={<Search className="h-4 w-4" />} />
          <Input placeholder="Location…" value={location} onChange={(e) => setLocation(e.target.value)} />
          <Select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
            <option value="Any">Any employment type</option>
            {WORK_MODES.filter((m) => m !== 'Any').map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </Select>
          <div className="flex items-end">
            <Button variant="secondary" onClick={() => { clearFilters(); load({ query: '', location: '', employmentType: 'Any' }) }} disabled={!hasFilters} className="w-full">
              Clear filters
            </Button>
          </div>
        </div>
      </Card>

      {error && <ErrorState message={error} onRetry={() => load()} />}

      {entries.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'No saved jobs match those filters.' : 'No saved jobs yet.'}
          description={hasFilters ? 'Try clearing the filters to see everything you have bookmarked.' : 'Open a completed analysis and bookmark jobs you like — they appear here.'}
          icon={hasFilters ? <SearchX className="h-6 w-6" /> : <Bookmark className="h-6 w-6" />}
          action={!hasFilters ? { label: 'Browse analyses', href: '/history' } : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => (
            <JobCard key={entry.job.id} job={entry.job} onToggleSave={onToggleSave} />
          ))}
        </div>
      )}

      {!loading && !error && (
        <p className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <Briefcase className="h-3.5 w-3.5" /> Jobs are read-only snapshots from your analyses — click "View Job" for the live posting.
        </p>
      )}
    </div>
  )
}