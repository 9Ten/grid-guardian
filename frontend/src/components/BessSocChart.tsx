import {
  ComposedChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts'
import type { BessSocPoint } from '../types'

interface Props {
  data: BessSocPoint[]
}

export default function BessSocChart({ data }: Props) {
  return (
    <div className="flex-1 min-h-0 px-2 pt-0 pb-1">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#374151' }} />
          <YAxis
            domain={[0, 100]}
            tickCount={6}
            tick={{ fontSize: 11, fill: '#374151' }}
            width={34}
            tickFormatter={v => `${v}%`}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, padding: '4px 8px', border: '1px solid #e2e8f0' }}
            formatter={(value: number) => [`${value}%`, 'BESS SoC']}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} iconSize={11} />

          <Area
            dataKey="soc"
            name="BESS SoC(%)"
            fill="#ede9fe"
            stroke="#5B2D8E"
            strokeWidth={2}
            fillOpacity={0.5}
            dot={false}
          />

          <ReferenceLine
            y={20}
            stroke="#94a3b8"
            strokeDasharray="5 3"
            strokeWidth={1}
            label={{ value: 'SoC Limit (20%–90%)', position: 'insideTopRight', fontSize: 10, fill: '#374151' }}
          />
          <ReferenceLine
            y={90}
            stroke="#94a3b8"
            strokeDasharray="5 3"
            strokeWidth={1}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
