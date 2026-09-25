import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface Props {
  data: Array<{ name: string; market: number; user: number }>
  height?: number
}

export function MatchChart({ data, height = 280 }: Props) {
  return (
    <div style={{ height }} className="w-full">
      {data.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-slate-400">Run an analysis to compare skills.</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={0} angle={-18} textAnchor="end" height={44} />
            <YAxis unit="%" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(148,163,184,0.08)' }}
              contentStyle={{ borderRadius: 12, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Bar dataKey="market" name="Market Demand" fill="#3383fb" radius={[4, 4, 0, 0]} />
            <Bar dataKey="user" name="Your Skills" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}