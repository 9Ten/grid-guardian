import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { SERIES_COLORS } from '../data/mockDashboardData'
import type { HourlyDispatch } from '../types'

interface Props {
  data: HourlyDispatch[]
}

export default function DispatchPowerChart({ data }: Props) {
  const chartData = data.map(d => ({ ...d, bessCharge: -d.bessCharge }))

  return (
    <div className="flex-1 min-h-0 px-2 pt-0 pb-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#374151' }} />
          <YAxis
            domain={[-6, 18]}
            tickCount={9}
            tick={{ fontSize: 11, fill: '#374151' }}
            width={34}
            tickFormatter={v => `${v}`}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, padding: '4px 8px', border: '1px solid #e2e8f0' }}
            formatter={(value: number, name: string) => [
              `${Math.abs(value).toFixed(1)} MW`,
              name,
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 2 }} iconSize={11} />
          <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />

          <Bar dataKey="gridImport"    name="Grid Import"            stackId="pos" fill={SERIES_COLORS.gridImport}    />
          <Bar dataKey="dieselPower"   name="Diesel Power Generator" stackId="pos" fill={SERIES_COLORS.dieselPower}   />
          <Bar dataKey="bessDischarge" name="BESS Discharge"         stackId="pos" fill={SERIES_COLORS.bessDischarge} />
          <Bar dataKey="solarPV"       name="Solar PV"               stackId="pos" fill={SERIES_COLORS.solarPV}       />
          <Bar dataKey="bessCharge"    name="BESS Charge"            stackId="neg" fill={SERIES_COLORS.bessCharge}    />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
