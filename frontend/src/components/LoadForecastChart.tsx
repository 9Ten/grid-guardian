import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Filler, Tooltip, Legend,
  type Plugin,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { mockForecast } from '../data/mockForecast'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

// ── custom plugins ──────────────────────────────────────────
const warningZonePlugin: Plugin<'line'> = {
  id: 'warningZone',
  beforeDraw(chart) {
    const { ctx, chartArea: { top, bottom }, scales: { x } } = chart
    const x1 = x.getPixelForValue(18)
    const x2 = x.getPixelForValue(22)
    ctx.save()
    ctx.fillStyle = 'rgba(255,61,87,0.07)'
    ctx.fillRect(x1, top, x2 - x1, bottom - top)
    ctx.restore()
  },
}

const nowLinePlugin: Plugin<'line'> = {
  id: 'nowLine',
  afterDraw(chart) {
    const { ctx, chartArea: { top, bottom }, scales: { x } } = chart
    const nx = x.getPixelForValue(16)
    ctx.save()
    ctx.strokeStyle = 'rgba(204,232,255,0.45)'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.beginPath(); ctx.moveTo(nx, top); ctx.lineTo(nx, bottom); ctx.stroke()
    ctx.fillStyle = 'rgba(204,232,255,0.6)'
    ctx.font = '9px "Share Tech Mono", monospace'
    ctx.fillText('NOW', nx + 4, top + 12)
    ctx.restore()
  },
}

// ── data ────────────────────────────────────────────────────
const labels   = mockForecast.map(p => p.label)
const actual   = mockForecast.map(p => p.actual)
const forecast = mockForecast.map(p => p.forecast)
const upper    = mockForecast.map(p => p.upper)
const lower    = mockForecast.map(p => p.lower)
const gridLimit = mockForecast.map(() => 5.0)

// ── chart config ────────────────────────────────────────────
const data = {
  labels,
  datasets: [
    {
      label: 'Confidence Upper',
      data: upper,
      borderColor: 'rgba(255,140,0,0.25)',
      borderWidth: 1,
      backgroundColor: 'rgba(255,140,0,0.08)',
      fill: '+1' as const,
      pointRadius: 0,
      tension: 0.4,
      order: 10,
    },
    {
      label: 'Confidence Lower',
      data: lower,
      borderColor: 'rgba(255,140,0,0.25)',
      borderWidth: 1,
      backgroundColor: 'transparent',
      fill: false as const,
      pointRadius: 0,
      tension: 0.4,
      order: 11,
    },
    {
      label: 'AI Forecast',
      data: forecast,
      borderColor: 'rgba(255,140,0,0.9)',
      borderWidth: 2,
      borderDash: [5, 4],
      pointRadius: 0,
      tension: 0.4,
      fill: false as const,
      order: 3,
    },
    {
      label: 'Actual Load',
      data: actual,
      borderColor: '#00cfff',
      borderWidth: 2.5,
      pointRadius: mockForecast.map((_, i) => i === 16 ? 5 : 0),
      pointBackgroundColor: '#00cfff',
      tension: 0.4,
      fill: false as const,
      order: 1,
    },
    {
      label: 'Grid Limit',
      data: gridLimit,
      borderColor: 'rgba(255,61,87,0.85)',
      borderWidth: 2,
      borderDash: [4, 4],
      pointRadius: 0,
      fill: false as const,
      order: 2,
    },
  ],
}

const options = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(6,13,26,0.96)',
      borderColor: 'rgba(0,180,255,0.3)',
      borderWidth: 1,
      titleColor: '#cce8ff',
      bodyColor: '#7aadcc',
      padding: 10,
      titleFont: { family: '"Share Tech Mono", monospace', size: 11 },
      bodyFont: { family: '"Share Tech Mono", monospace', size: 11 },
      callbacks: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        label: (ctx: any) => {
          if ((ctx.dataset.label as string).includes('Confidence')) return undefined
          if (ctx.parsed.y === null) return undefined
          return ` ${ctx.dataset.label}: ${(ctx.parsed.y as number).toFixed(1)} MW`
        },
      },
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(0,180,255,0.04)' },
      ticks: {
        color: '#4a7a9b',
        font: { family: '"Share Tech Mono", monospace', size: 9 },
        maxTicksLimit: 12,
        autoSkip: true,
      },
    },
    y: {
      min: 2.5, max: 10.5,
      grid: { color: 'rgba(0,180,255,0.06)' },
      ticks: {
        color: '#4a7a9b',
        font: { family: '"Share Tech Mono", monospace', size: 9 },
        callback: (v: number | string) => `${Number(v).toFixed(1)} MW`,
      },
    },
  },
}

// ── component ────────────────────────────────────────────────
export default function LoadForecastChart() {
  return (
    <div className="panel animate-fade-in">
      <div className="panel-header">
        <span className="panel-title">Load Forecast vs Actual</span>
        <span className="panel-badge">AI MODEL · MAPE 6.2%</span>
      </div>
      <div className="p-3.5">
        {/* KPI row */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <KpiCard value="7.4" label="LOAD NOW (MW)"     sub="16:00 น."              valueColor="#ffab00" />
          <KpiCard value="8.3" label="FORECAST PEAK (MW)" sub="19:00 · เกิน grid limit" valueColor="#ff3d57" />
          <KpiCard value="+0.6" label="GRID HEADROOM (MW)" sub="ก่อนถึง bottleneck"     valueColor="#00fff7" />
          <KpiCard value="6.2%" label="MAPE"             sub="ค่าเป้าหมาย ≤10%"      valueColor="#00e676" />
        </div>

        {/* overload badge */}
        <div className="flex justify-end mb-1">
          <span
            className="font-display font-semibold text-[9px] tracking-wide px-2 py-0.5"
            style={{
              background: 'rgba(255,61,87,0.15)',
              color: '#ff3d57',
              border: '1px solid rgba(255,61,87,0.3)',
            }}
          >
            ⚠ OVERLOAD ZONE 18:00–22:00
          </span>
        </div>

        {/* chart */}
        <div style={{ height: 195, position: 'relative' }}>
          <Line
            data={data}
            options={options}
            plugins={[warningZonePlugin, nowLinePlugin]}
          />
        </div>

        {/* legend */}
        <div className="flex flex-wrap gap-3.5 mt-2">
          <LegendItem color="#00cfff"              label="Actual load" />
          <LegendItem color="rgba(255,140,0,0.9)"  label="AI forecast" dashed />
          <LegendItem color="rgba(255,109,0,0.18)" label="Confidence ±1.2 MW" box />
          <LegendItem color="rgba(255,61,87,0.85)" label="Grid limit 5.0 MW"  dashed />
        </div>

        {/* advisory annotation */}
        <div
          className="mt-2 px-2.5 py-1.5 text-[11px] leading-relaxed"
          style={{
            background: 'rgba(255,61,87,0.06)',
            borderLeft: '2px solid #ff3d57',
            color: '#4a7a9b',
          }}
        >
          <span className="font-display font-bold" style={{ color: '#ff3d57' }}>ADVISORY: </span>
          Forecast เกิน grid capacity ช่วง 18:00–22:00 — แนะนำเปิด Diesel Unit 2 (+2.5 MW) ก่อน 17:30
          <span className="float-right font-mono text-[10px]">
            Input: load history · อุณหภูมิ · hotel occupancy
          </span>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  value, label, sub, valueColor,
}: {
  value: string; label: string; sub: string; valueColor: string
}) {
  return (
    <div
      className="text-center px-3 py-2.5"
      style={{ background: '#0f1e35', border: '1px solid rgba(0,180,255,0.12)' }}
    >
      <div className="font-mono text-xl mb-0.5" style={{ color: valueColor }}>{value}</div>
      <div className="text-[10px] tracking-wide" style={{ color: '#4a7a9b' }}>{label}</div>
      <div className="text-[9px] mt-0.5" style={{ color: valueColor === '#ff3d57' ? '#ff3d57' : '#4a7a9b' }}>{sub}</div>
    </div>
  )
}

function LegendItem({
  color, label, dashed, box,
}: {
  color: string; label: string; dashed?: boolean; box?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5 text-[10px]" style={{ color: '#4a7a9b' }}>
      {box
        ? <div style={{ width: 18, height: 10, background: color, borderRadius: 2 }} />
        : <div style={{ width: 18, height: 3, background: dashed ? 'transparent' : color, borderRadius: 2, borderTop: dashed ? `2px dashed ${color}` : 'none' }} />
      }
      {label}
    </div>
  )
}
