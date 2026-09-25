import { useMemo, useRef, useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { UploadCloud, FileText, X, Target, MapPin, Sparkles, Building2, Clock } from 'lucide-react'
import { api, getErrorMessage } from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { ROLE_SUGGESTIONS, LOCATION_SUGGESTIONS, EXPERIENCE_LEVELS, WORK_MODES } from '@/utils/format'

const MAX_MB = 10

export function Analyze() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [role, setRole] = useState(user?.profile?.target_role || '')
  const [roleOpen, setRoleOpen] = useState(false)
  const [location, setLocation] = useState(user?.profile?.target_location || '')
  const [locationOpen, setLocationOpen] = useState(false)
  const [experience, setExperience] = useState(user?.profile?.experience_level || 'Fresher')
  const [workMode, setWorkMode] = useState('Any')

  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [roleError, setRoleError] = useState('')

  const roleMatches = useMemo(() => {
    const q = role.trim().toLowerCase()
    if (!q) return ROLE_SUGGESTIONS
    return ROLE_SUGGESTIONS.filter((r) => r.toLowerCase().includes(q)).sort((a, b) => {
      const aPrefix = a.toLowerCase().startsWith(q) ? 0 : 1
      const bPrefix = b.toLowerCase().startsWith(q) ? 0 : 1
      return aPrefix - bPrefix || a.localeCompare(b)
    })
  }, [role])

  const locationMatches = useMemo(() => {
    const q = location.trim().toLowerCase()
    if (!q) return LOCATION_SUGGESTIONS
    return LOCATION_SUGGESTIONS.filter((l) => l.toLowerCase().includes(q)).sort((a, b) => {
      const aPrefix = a.toLowerCase().startsWith(q) ? 0 : 1
      const bPrefix = b.toLowerCase().startsWith(q) ? 0 : 1
      return aPrefix - bPrefix || a.localeCompare(b)
    })
  }, [location])

  const acceptFile = (f?: File | null) => {
    if (!f) return
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File exceeds the ${MAX_MB} MB limit.`)
      return
    }
    const name = f.name.toLowerCase()
    if (!name.endsWith('.pdf') && !name.endsWith('.docx') && !name.endsWith('.txt')) {
      setError('Only PDF, DOCX, or TXT files are supported.')
      return
    }
    setError('')
    setFile(f)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    acceptFile(e.dataTransfer.files?.[0])
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!role.trim()) {
      setRoleError('Target role is required.')
      setError('Please enter a target job role.')
      return
    }
    setRoleError('')
    if (!file) {
      setError('Please upload your resume (PDF).')
      return
    }

    const form = new FormData()
    form.append('target_role', role.trim())
    if (location.trim()) form.append('location', location.trim())
    if (experience && experience !== 'Any') form.append('experience_level', experience)
    if (workMode && workMode !== 'Any') form.append('employment_type', workMode)
    form.append('file', file)

    setUploading(true)
    setUploadProgress(0)
    try {
      const { data } = await api.post('/analyses', form, {
        onUploadProgress: (evt) => {
          if (evt.total) setUploadProgress(Math.round((evt.loaded / evt.total) * 100))
        },
      })
      toast.success('Analysis started — your agents are on it.')
      navigate(`/analysis/${data.analysis.id}`, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, 'Could not start the analysis.'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analyze My Career</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Upload your resume, choose your target, and let the agents scan the live market.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        <Card>
          <CardHeader
            title="Target Job Role"
            subtitle="Pick a suggestion or type any role — the AI handles the rest."
          />
          <div className="relative">
            <Input
              label="Role"
              placeholder="e.g. AI Product Manager, Network Engineer…"
              value={role}
              error={roleError}
              onChange={(e) => {
                setRole(e.target.value)
                setRoleOpen(true)
              }}
              onFocus={() => setRoleOpen(true)}
              onBlur={() => setTimeout(() => setRoleOpen(false), 150)}
              icon={<Target className="h-4 w-4" />}
            />
            {roleOpen && (
              <div className="absolute z-10 mt-1.5 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-surface-800">
                {roleMatches.length > 0 ? (
                  <>
                    {roleMatches.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onMouseDown={() => {
                          setRole(r)
                          setRoleOpen(false)
                        }}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-brand-50 dark:hover:bg-brand-900/30"
                      >
                        {r}
                      </button>
                    ))}
                    {role.trim() && !roleMatches.some((r) => r.toLowerCase() === role.trim().toLowerCase()) && (
                      <button
                        type="button"
                        onMouseDown={() => {
                          setRole(role.trim())
                          setRoleOpen(false)
                        }}
                        className="mt-1 w-full rounded-lg border-t border-slate-100 px-3 py-2 text-left text-sm font-semibold text-brand-600 hover:bg-brand-50 dark:border-slate-700 dark:hover:bg-brand-900/30"
                      >
                        Use “{role.trim()}” as your role
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onMouseDown={() => {
                      setRole(role.trim())
                      setRoleOpen(false)
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30"
                  >
                    Use “{role.trim()}” as your role
                  </button>
                )}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Target Market" subtitle="Where do you want to work?" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative">
              <Input
                label="Location"
                placeholder="Search any city — e.g. Mumbai, Kochi…"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value)
                  setLocationOpen(true)
                }}
                onFocus={() => setLocationOpen(true)}
                onBlur={() => setTimeout(() => setLocationOpen(false), 150)}
                icon={<MapPin className="h-4 w-4" />}
              />
              {locationOpen && (
                <div className="absolute z-10 mt-1.5 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-surface-800">
                  {locationMatches.length > 0 ? (
                    <>
                      {locationMatches.map((l) => (
                        <button
                          key={l}
                          type="button"
                          onMouseDown={() => {
                            setLocation(l)
                            setLocationOpen(false)
                          }}
                          className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-brand-50 dark:hover:bg-brand-900/30"
                        >
                          {l}
                        </button>
                      ))}
                      {location.trim() && !locationMatches.some((l) => l.toLowerCase() === location.trim().toLowerCase()) && (
                        <button
                          type="button"
                          onMouseDown={() => {
                            setLocation(location.trim())
                            setLocationOpen(false)
                          }}
                          className="mt-1 w-full rounded-lg border-t border-slate-100 px-3 py-2 text-left text-sm font-semibold text-brand-600 hover:bg-brand-50 dark:border-slate-700 dark:hover:bg-brand-900/30"
                        >
                          Use “{location.trim()}” as your location
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onMouseDown={() => {
                        setLocation(location.trim())
                        setLocationOpen(false)
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30"
                    >
                      Use “{location.trim()}” as your location
                    </button>
                  )}
                </div>
              )}
            </div>
            <Select label="Experience Level" value={experience} onChange={(e) => setExperience(e.target.value)}>
              {EXPERIENCE_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </Select>
          </div>
          <div className="mt-4">
            <Select label="Preferred Employment Type" value={workMode} onChange={(e) => setWorkMode(e.target.value)}>
              {WORK_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </div>
        </Card>

        <Card>
          <CardHeader title="Resume" subtitle="PDF, DOCX or TXT · up to 10 MB" />
          {!file ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 py-12 transition-colors hover:border-brand-400 hover:bg-brand-50/40 dark:border-slate-700 dark:hover:border-brand-600 dark:hover:bg-brand-900/10"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                <UploadCloud className="h-6 w-6" />
              </span>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Drag & drop your resume here, or click to browse</p>
              <p className="text-xs text-slate-400">Only your resume text is used — never your personal details beyond analysis.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={(e) => {
                  acceptFile(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-surface-800">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-surface-900"
                aria-label="Remove file"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {uploading && (
            <div className="flex-1">
              <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>Uploading resume…</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-surface-800">
                <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}
          <Button type="submit" loading={uploading} className="w-full sm:w-auto sm:px-8">
            <Sparkles className="h-4 w-4" />
            Analyze My Career
          </Button>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-slate-100 p-4 text-xs text-slate-500 dark:bg-surface-800 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5" /> Live job listings
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> Analysis takes ~30–90 seconds
        </span>
        <Link to="/history" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
          View previous analyses →
        </Link>
      </div>
    </div>
  )
}