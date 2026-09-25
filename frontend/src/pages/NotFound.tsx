import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center dark:bg-surface-950">
      <Compass className="h-12 w-12 text-brand-500" />
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white">404</h1>
      <p className="text-slate-500 dark:text-slate-400">The page you are looking for doesn't exist.</p>
      <Link to="/" className="btn-primary mt-2">
        Back to home
      </Link>
    </div>
  )
}