import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

interface Props {
  distribution: { strong: number; partial: number; missing: number }
  height?: number
}

const COLORS: Record<string, string> = {
  strong: '#22c55e',
  partial: '#f59e0b',
  missing: '#ef4444',
}

const LABELS: Record<string, string> = {
  strong: 'Strong',
  partial: 'Partial',
  missing: 'Missing',
}

export function SkillGapDonut({ distribution, height = 240 }: Props) {
  const total = distribution.strong + distribution.partial + distribution.missing
  const data = Object.entries(distribution)
    .map(([key, value]) => ({ name: LABELS[key] || key, value, fill: COLORS[key] }))
    .filter((d) => d.value > 0)

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div style={{ height }} className="w-full max-w-[260px]">
        {total === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">No skill data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3} strokeWidth={2}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="w-full space-y-2">
        {(['strong', 'partial', 'missing'] as const).map((key) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="h-3 w-3 rounded-full" style={{ background: COLORS[key] }} />
              {LABELS[key]}
            </span>
            <span className="font-semibold text-slate-900 dark:text-white">{distribution[key]}</span>
          </div>
        ))}
        <div className="flex items-center justify-between border-t pt-2 text-sm">
          <span className="text-slate-500 dark:text-slate-400">Total skills tracked</span>
          <span className="font-semibold text-slate-900 dark:text-white">{total}</span>
        </div>
      </div>
    </div>
  )
}