
import { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import {
  LayoutDashboard,
  LineChart,
  Target,
  Activity,
  Compass,
  Bookmark,
  History,
  User,
  Settings,
  LogOut,
  Sparkles,
  X,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { initials } from '@/utils/format'

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/analyze', label: 'Analyze Career', icon: Target },
  { to: '/market', label: 'Market Intelligence', icon: LineChart },
  { to: '/skills', label: 'My Skills', icon: Activity },
  { to: '/roadmap', label: 'Roadmap', icon: Compass },
  { to: '/saved-jobs', label: 'Saved Jobs', icon: Bookmark },
  { to: '/history', label: 'History', icon: History },
]

const BOTTOM_NAV = [
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const linkClass = ({ isActive }: { isActive: boolean }): string =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-brand-600 text-white shadow-sm'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-surface-800 dark:hover:text-white'
    }`

  const NavItems = () => (
    <>
      {NAV.map((item) => {
        const Icon = item.icon
        return (
          <NavLink key={item.to} to={item.to} className={linkClass} onClick={onClose}>
            <Icon className="h-4.5 w-4.5 h-5 w-5" />
            {item.label}
          </NavLink>
        )
      })}
    </>
  )

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-surface-900 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-5 py-5">
            <NavLink to="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-white">
                CareerScope <span className="text-brand-600">AI</span>
              </span>
            </NavLink>
            <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 lg:hidden dark:hover:bg-surface-800">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-5 pb-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Workspace
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3">
            <NavItems />
          </nav>

          <div className="space-y-1 border-t border-slate-200 px-3 py-4 dark:border-slate-800">
            {BOTTOM_NAV.map((item) => {
              const Icon = item.icon
              return (
                <NavLink key={item.to} to={item.to} className={linkClass} onClick={onClose}>
                  <Icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              )
            })}
            <button
              onClick={async () => {
                await logout()
                onClose()
                navigate('/signin', { replace: true })
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-300 dark:hover:bg-red-900/20"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>

          <div className="border-t border-slate-200 px-5 py-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
                {initials(user?.full_name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {user?.full_name}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
