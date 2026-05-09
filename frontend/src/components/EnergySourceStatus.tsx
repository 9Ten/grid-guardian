import type { SourceMeter, MeterStatus } from '../types'
import { mockMeters } from '../data/mockMeters'

const FILL_CLASS: Record<string, string> = {
  grid:   'fill-grid',
  diesel: 'fill-diesel',
  bess:   'fill-bess',
}

const MW_COLOR: Record<string, string> = {
  grid:   '#00cfff',
  diesel: '#ffab00',
  bess:   '#00e676',
}

const STATUS_STYLE: Record<MeterStatus, { label: string; style: React.CSSProperties }> = {
  on:   { label: 'ON',   style: { background: 'rgba(0,230,118,0.15)', color: '#00e676' } },
  warn: { label: 'RUN',  style: { background: 'rgba(255,171,0,0.15)',  color: '#ffab00' } },
  off:  { label: 'IDLE', style: { background: 'rgba(255,255,255,0.05)', color: '#4a7a9b' } },
  rdy:  { label: 'RDY',  style: { background: 'rgba(0,230,118,0.15)', color: '#00e676' } },
}

export default function EnergySourceStatus() {
  const meters: SourceMeter[] = mockMeters

  return (
    <div className="panel animate-fade-in h-full">
      <div className="panel-header">
        <span className="panel-title">Energy Source Status</span>
        <span className="panel-badge">LIVE</span>
      </div>
      <div className="p-3.5 flex flex-col gap-2.5">
        {meters.map(meter => (
          <MeterRow key={meter.name} meter={meter} />
        ))}
      </div>
    </div>
  )
}

function MeterRow({ meter }: { meter: SourceMeter }) {
  const pct = Math.min((meter.mw / meter.maxMw) * 100, 100)
  const { label, style } = STATUS_STYLE[meter.status]

  return (
    <div className="flex items-center gap-2.5">
      <div className="text-[11px] w-28 shrink-0" style={{ color: '#cce8ff' }}>
        {meter.name}
      </div>
      <div
        className="flex-1 h-3.5 relative overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      >
        <div
          className={`${FILL_CLASS[meter.color]} h-full transition-all duration-700 relative`}
          style={{ width: `${pct}%` }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 4px, transparent 4px, transparent 8px)',
            }}
          />
        </div>
      </div>
      <div
        className="font-mono text-[12px] text-right w-14 shrink-0"
        style={{ color: MW_COLOR[meter.color] }}
      >
        {meter.name === 'BESS SOC'
          ? `${Math.round(pct)}%`
          : `${meter.mw.toFixed(1)} MW`}
      </div>
      <div className="w-14 shrink-0">
        <span
          className="font-display font-bold text-[10px] px-1.5 py-0.5 tracking-wide"
          style={style}
        >
          {label}
        </span>
      </div>
    </div>
  )
}
