import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { MarketSkill } from '@/api/types'

interface Props {
  data: MarketSkill[]
  height?: number
  colorFor?: (entry: MarketSkill) => string
}

export function SkillDemandChart({ data, height = 280, colorFor }: Props) {
  const chartData = data.slice(0, 10).map((d) => ({ ...d, label: d.name }))

  return (
    <div style={{ height }} className="w-full">
      {chartData.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-slate-400">No skill demand data yet.</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" opacity={0.08} />
            <XAxis type="number" unit="%" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="label"
              width={110}
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(148,163,184,0.08)' }}
              contentStyle={{ borderRadius: 12, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0' }}
              formatter={(value: number) => [`${value}% of jobs`, 'Demand']}
            />
            <Bar dataKey="market_percentage" radius={[0, 6, 6, 0]} barSize={18}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={colorFor ? colorFor(entry) : (entry.user_has_skill ? '#22c55e' : '#3383fb')} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}