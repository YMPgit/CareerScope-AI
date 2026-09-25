import { useEffect, useState, FormEvent } from 'react'
import toast from 'react-hot-toast'
import { Briefcase, Calendar, Compass, FileText, Save, UserRound } from 'lucide-react'
import { api, getErrorMessage } from '@/api/client'
import { ProfileOut, ProfileResponse, ProfileStats, UserProfileData } from '@/api/types'
import { useAuth } from '@/context/AuthContext'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { ErrorState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { EXPERIENCE_LEVELS, WORK_MODES, formatDate } from '@/utils/format'

const PROFILE_DEFAULTS: UserProfileData = {
  target_role: '',
  target_location: '',
  experience_level: '',
  preferred_work_mode: '',
  career_interests: '',
  bio: '',
}

export function Profile() {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState<UserProfileData>(PROFILE_DEFAULTS)
  const [fullName, setFullName] = useState('')
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get<ProfileResponse>('/profile')
      const p = data.profile
      setFullName(p.full_name || '')
      setForm({
        target_role: p.target_role || '',
        target_location: p.target_location || '',
        experience_level: p.experience_level || '',
        preferred_work_mode: p.preferred_work_mode || '',
        career_interests: p.career_interests || '',
        bio: p.bio || '',
      })
      setStats(data.stats)
      updateProfile({
        target_role: p.target_role,
        target_location: p.target_location,
        experience_level: p.experience_level,
        preferred_work_mode: p.preferred_work_mode,
        career_interests: p.career_interests,
        bio: p.bio,
      })
      setError('')
      setLoaded(true)
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

  const set = <K extends keyof UserProfileData>(key: K, value: string) => setForm((prev) => ({ ...prev, [key]: value }))

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      toast.error('Your name cannot be empty.')
      return
    }
    setSaving(true)
    try {
      const payload = { full_name: fullName.trim(), ...form }
      const { data } = await api.put<{ profile: ProfileOut }>('/profile', payload)
      updateProfile({
        target_role: data.profile.target_role,
        target_location: data.profile.target_location,
        experience_level: data.profile.experience_level,
        preferred_work_mode: data.profile.preferred_work_mode,
        career_interests: data.profile.career_interests,
        bio: data.profile.bio,
      })
      toast.success('Profile saved')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading && !loaded) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-6 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <CardSkeleton />
      </div>
    )
  }

  if (error && !loaded) return <ErrorState message={error} onRetry={load} />

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Your Profile</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Defaults used by every new career analysis.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatMini icon={<Briefcase className="h-4 w-4" />} label="Analyses" value={stats?.analyses_count ?? 0} />
        <StatMini icon={<FileText className="h-4 w-4" />} label="Resumes" value={stats?.resumes_count ?? 0} />
        <StatMini icon={<Compass className="h-4 w-4" />} label="Roadmap" value={`${Math.round(stats?.roadmap_progress ?? 0)}%`} />
        <StatMini icon={<Calendar className="h-4 w-4" />} label="Last analysis" value={formatDate(stats?.last_analysis_date)} />
      </div>

      <form onSubmit={save} className="space-y-6">
        <Card>
          <CardHeader title="Basics" subtitle="Your name and email" />
          <div className="grid gap-4">
            <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} icon={<UserRound className="h-4 w-4" />} />
            <div>
              <label className="label">Email</label>
              <div className="input flex items-center gap-2 bg-slate-50 text-slate-500 dark:bg-surface-800">
                {user?.email}
                {user?.is_verified ? (
                  <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Verified</span>
                ) : (
                  <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Unverified</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Career preferences" subtitle="These pre-fill the analysis form" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Dream job title" value={form.target_role || ''} onChange={(e) => set('target_role', e.target.value)} placeholder="e.g. Data Analyst" />
            <Input label="Dream location" value={form.target_location || ''} onChange={(e) => set('target_location', e.target.value)} placeholder="e.g. Mumbai" />
            <Select label="Experience level" value={form.experience_level || ''} onChange={(e) => set('experience_level', e.target.value)}>
              <option value="">Not set</option>
              {EXPERIENCE_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </Select>
            <Select label="Preferred work mode" value={form.preferred_work_mode || ''} onChange={(e) => set('preferred_work_mode', e.target.value)}>
              <option value="">Not set</option>
              {WORK_MODES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Select>
            <div className="sm:col-span-2">
              <Input label="Career interests" value={form.career_interests || ''} onChange={(e) => set('career_interests', e.target.value)} placeholder="e.g. analytics, dashboards, SQL, dashboarding at scale" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Short bio</label>
              <textarea
                className="input min-h-24 w-full resize-y"
                value={form.bio || ''}
                onChange={(e) => set('bio', e.target.value)}
                placeholder="A couple of sentences…"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={saving} icon={<Save className="h-4 w-4" />}>
            Save profile
          </Button>
        </div>
      </form>
    </div>
  )
}

function StatMini({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">{icon} {label}</div>
      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}