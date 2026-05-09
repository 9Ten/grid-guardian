import type { DispatchMode } from '../types'
import { mockDispatch, GANTT_HOURS } from '../data/mockDispatch'

const BAR_CLASS: Record<DispatchMode, string> = {
  grid:            'bar-grid',
  diesel:          'bar-diesel',
  bess_discharge:  'bar-bess-dis',
  bess_charge:     'bar-bess-ch',
  off:             'bar-off',
}

const LEGEND = [
  { label: 'Grid',           cls: 'bar-grid' },
  { label: 'Diesel',         cls: 'bar-diesel' },
  { label: 'BESS Discharge', cls: 'bar-bess-dis' },
  { label: 'BESS Charge',    cls: 'bar-bess-ch' },
  { label: 'Off',            cls: 'bar-off' },
]

export default function DispatchGantt() {
  return (
    <div className="panel animate-fade-in">
      <div className="panel-header">
        <span className="panel-title">Recommended Dispatch Schedule</span>
        <span className="panel-badge">OPTIMIZER OUTPUT · TODAY</span>
      </div>
      <div className="p-3.5">
        {/* summary */}
        <div className="flex gap-5 mb-2.5 text-[11px] flex-wrap">
          <span style={{ color: '#cce8ff' }}>
            ประหยัดเชื้อเพลิงเทียบ baseline:{' '}
            <span className="font-mono" style={{ color: '#00e676' }}>-340 L/day</span>
          </span>
          <span style={{ color: '#cce8ff' }}>
            Cost saving:{' '}
            <span className="font-mono" style={{ color: '#00e676' }}>฿18,600 / วัน</span>
          </span>
        </div>

        {/* table */}
        <div className="overflow-x-auto">
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th
                  className="font-mono text-[9px] text-left pb-1 pr-2 whitespace-nowrap"
                  style={{ color: '#4a7a9b', minWidth: 100 }}
                >
                  Source
                </th>
                {GANTT_HOURS.map(h => (
                  <th
                    key={h}
                    className="font-mono text-[9px] text-center pb-1 px-px"
                    style={{ color: '#4a7a9b', borderBottom: '1px solid rgba(0,180,255,0.12)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockDispatch.map(row => (
                <tr key={row.source}>
                  <td
                    className="text-[11px] py-1 pr-2 whitespace-nowrap font-medium"
                    style={{ color: '#cce8ff' }}
                  >
                    {row.source}
                  </td>
                  {row.cells.map((cell, i) => (
                    <td key={i} className="py-px px-px" style={{ height: 22 }}>
                      <div
                        className={`${BAR_CLASS[cell.mode]} h-full rounded-sm flex items-center justify-center`}
                        style={{ minWidth: 22 }}
                      >
                        {cell.mw !== null && cell.mode !== 'off' && (
                          <span
                            className="font-mono font-semibold leading-none"
                            style={{ fontSize: 7, color: '#000' }}
                          >
                            {cell.mode === 'bess_charge' ? `-${cell.mw.toFixed(1)}` : cell.mw.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* legend */}
        <div className="flex flex-wrap gap-3.5 mt-2.5">
          {LEGEND.map(({ label, cls }) => (
            <div key={label} className="flex items-center gap-1.5 text-[10px]" style={{ color: '#4a7a9b' }}>
              <div className={`${cls} rounded-sm`} style={{ width: 14, height: 10 }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
