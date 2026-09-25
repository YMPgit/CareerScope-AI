import { Bookmark, ExternalLink, MapPin, Building2, Clock, Briefcase, StickyNote } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, getErrorMessage } from '@/api/client'
import { Job } from '@/api/types'
import { truncate } from '@/utils/format'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface Props {
  job: Job
  onToggleSave?: (jobId: number, saved: boolean) => void
}

export function JobCard({ job, onToggleSave }: Props) {
  const saving = async () => {
    try {
      if (job.is_saved) {
        await api.delete(`/jobs/${job.id}/save`)
        toast.success('Job removed from saved jobs')
      } else {
        await api.post(`/jobs/${job.id}/save`)
        toast.success('Job saved')
      }
      onToggleSave?.(job.id, !job.is_saved)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="card flex flex-col gap-3 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold text-slate-900 dark:text-white">{job.title}</h4>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {job.company || 'Company not listed'}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {job.location || 'Location not specified'}
            </span>
          </div>
        </div>
        <button
          onClick={saving}
          aria-label={job.is_saved ? 'Unsave job' : 'Save job'}
          className={`rounded-lg p-2 transition-colors ${
            job.is_saved ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/30' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-surface-800'
          }`}
        >
          <Bookmark className={`h-5 w-5 ${job.is_saved ? 'fill-current' : ''}`} />
        </button>
      </div>

      {(job.remote_type || job.employment_type || job.experience) && (
        <div className="flex flex-wrap gap-1.5">
          {job.remote_type && (
            <Badge tone={job.remote_type === 'Remote' ? 'green' : job.remote_type === 'Hybrid' ? 'purple' : 'gray'}>
              <Briefcase className="h-3 w-3" /> {job.remote_type}
            </Badge>
          )}
          {job.employment_type && <Badge tone="blue">{job.employment_type}</Badge>}
          {job.experience && <Badge tone="cyan">{job.experience} experience</Badge>}
        </div>
      )}

      {job.description && <p className="line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{truncate(job.description, 220)}</p>}

      <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          {job.salary ? <span className="font-medium text-emerald-600 dark:text-emerald-400">{truncate(job.salary, 30)}</span> : <span className="italic">Salary not provided</span>}
          {job.posted_text && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {job.posted_text}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="gray">
            <StickyNote className="h-3 w-3" /> {job.source || 'Google Jobs'}
          </Badge>
        </div>
      </div>

      {job.url && (
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary w-full"
        >
          {job.apply_via ? `View on ${job.apply_via}` : 'View Job'} <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </div>
  )
}