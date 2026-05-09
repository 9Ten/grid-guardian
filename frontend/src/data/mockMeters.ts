import type { SourceMeter } from '../types'

export const mockMeters: SourceMeter[] = [
  { name: 'Main Grid',        mw: 4.3, maxMw: 10, status: 'on',   color: 'grid'   },
  { name: 'Diesel Gen. ⑦',   mw: 3.1, maxMw: 10, status: 'warn', color: 'diesel' },
  { name: 'BESS (discharge)', mw: 0,   maxMw: 10, status: 'off',  color: 'bess'   },
  { name: 'BESS SOC',         mw: 6.8, maxMw: 10, status: 'rdy',  color: 'bess'   },
]
