import { useState } from 'react'
import type { Alert, AlertSeverity } from '../types'
import { mockAlerts } from '../data/mockAlerts'

const SEVERITY_STYLE: Record<AlertSeverity, { borderColor: string; titleColor: string }> = {
  critical: { borderColor: '#ff3d57', titleColor: '#ff3d57' },
  warning:  { borderColor: '#ffab00', titleColor: '#ffab00' },
  info:     { borderColor: '#00cfff', titleColor: '#00cfff' },
}

export default function EarlyWarning() {
  const alerts: Alert[] = mockAlerts
  const activeCount = alerts.filter(a => a.severity !== 'info').length

  return (
    <div className="panel animate-fade-in">
      <div className="panel-header">
        <span className="panel-title">Early Warning</span>
        <span
          className="panel-badge"
          style={{ color: '#ff3d57', borderColor: '#ff3d57' }}
        >
          {activeCount} ACTIVE
        </span>
      </div>
      <div className="p-3.5 flex flex-col gap-2">
        {alerts.map(alert => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  )
}

function AlertCard({ alert }: { alert: Alert }) {
  const [acked, setAcked] = useState(false)
  const { borderColor, titleColor } = SEVERITY_STYLE[alert.severity]

  return (
    <div
      className="px-3 py-2"
      style={{
        borderLeft: `3px solid ${borderColor}`,
        background: '#0f1e35',
      }}
    >
      <div className="font-display font-bold text-[12px] mb-1" style={{ color: titleColor }}>
        {alert.title}
      </div>
      <div className="text-[11px] leading-relaxed" style={{ color: '#4a7a9b' }}>
        {alert.body}
      </div>
      <div className="font-mono text-[10px] mt-1" style={{ color: '#4a7a9b' }}>
        {alert.time}
      </div>
      <div className="flex gap-1.5 flex-wrap mt-1.5">
        {alert.primaryAction && (
          <button
            className="font-display font-bold text-[10px] tracking-wide px-2.5 py-1 text-black transition-colors"
            style={{ background: '#00cfff' }}
          >
            {alert.primaryAction}
          </button>
        )}
        {alert.secondaryAction && (
          <button
            className="font-display font-semibold text-[10px] tracking-wide px-2.5 py-1 transition-colors"
            style={{
              border: `1px solid ${borderColor}`,
              color: acked ? '#4a7a9b' : borderColor,
              background: 'transparent',
            }}
            onClick={() => setAcked(true)}
          >
            {acked ? '✓ ACKNOWLEDGED' : alert.secondaryAction}
          </button>
        )}
      </div>
    </div>
  )
}
