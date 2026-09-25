import { ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const { user, loading } = useAuth()

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-400 lg:block">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold">CareerScope AI</span>
          </Link>
          <div>
            <h2 className="max-w-md text-3xl font-bold leading-tight">
              Turn the live job market into your personal career roadmap.
            </h2>
            <p className="mt-3 max-w-md text-brand-50/90">
              Live job-market intelligence, analyzed in real time and personalized to your resume.
            </p>
          </div>
          <p className="text-xs text-brand-100/70">Data → Analysis → Evidence → Recommendation → Action</p>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-slate-50 px-4 py-12 dark:bg-surface-950 lg:w-1/2">
        <div className="w-full max-w-md animate-slide-up">
          <div className="mb-8 lg:hidden">
            <Link to="/" className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold">
                CareerScope <span className="text-brand-600">AI</span>
              </span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  )
}