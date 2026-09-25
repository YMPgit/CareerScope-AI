import { useState } from 'react'
import { Menu, Sparkles } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-surface-950">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur lg:px-8 dark:border-slate-800 dark:bg-surface-900/80">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-surface-800"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden items-center gap-2 lg:flex">
            <Sparkles className="h-4 w-4 text-brand-600" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Live job-market intelligence, tuned to your career</span>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8">
          <Outlet />
        </main>

        <footer className="px-4 py-4 text-center text-xs text-slate-400 lg:px-8">
          CareerScope AI · Live job postings analyzed in real time · Personalized to every resume
        </footer>
      </div>
    </div>
  )
}