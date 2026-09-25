import { CheckCircle2, MinusCircle, XCircle } from 'lucide-react'
import { MarketSkill } from '@/api/types'

const LEVEL_META: Record<string, { tone: string; bar: string; icon: typeof CheckCircle2; label: string }> = {
  strong: { tone: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500', icon: CheckCircle2, label: 'Strong' },
  partial: { tone: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500', icon: MinusCircle, label: 'Partial' },
  missing: { tone: 'text-red-600 dark:text-red-400', bar: 'bg-red-500', icon: XCircle, label: 'Missing' },
}

export function SkillBar({ skill, max }: { skill: MarketSkill; max: number }) {
  const meta = LEVEL_META[skill.skill_gap_level] || LEVEL_META.missing
  const Icon = meta.icon
  const width = max > 0 ? Math.max((skill.market_percentage / max) * 100, 2) : 0

  return (
    <div className="group">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-100">
          <Icon className={`h-4 w-4 ${meta.tone}`} />
          {skill.name}
          {skill.category && (
            <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:inline dark:bg-surface-800 dark:text-slate-400">
              {skill.category}
            </span>
          )}
        </span>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{skill.market_percentage}%</span>
      </div>
      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-surface-800">
        <div className={`h-full rounded-full ${meta.bar} transition-all duration-500`} style={{ width: `${width}%` }} />
      </div>
      <div className="mt-0.5 flex items-center justify-between text-[11px] text-slate-400">
        <span className={meta.tone}>{meta.label}</span>
        {skill.priority !== 'low' && (
          <span className={`uppercase ${skill.priority === 'high' ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'}`}>
            {skill.priority} priority
          </span>
        )}
      </div>
    </div>
  )
}