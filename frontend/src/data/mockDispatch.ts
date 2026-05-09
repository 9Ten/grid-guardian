import type { DispatchRow, DispatchCell, DispatchMode } from '../types'

const MODES: Record<string, DispatchMode> = {
  G: 'grid', D: 'diesel', X: 'bess_discharge', C: 'bess_charge', O: 'off',
}

const RAW: { source: string; codes: string; mws: (number | null)[] }[] = [
  {
    source: 'Main Grid',
    codes: 'GGGGGGGGGGGGGGGGGGGGGGG',
    mws: [4.7,4.5,4.2,4.3,4.6,4.5,4.5,4.5,4.5,4.5,4.5,4.5,4.5,4.5,4.5,4.5,4.5,4.5,4.5,4.5,4.0,4.0,4.0],
  },
  {
    source: 'Diesel',
    codes: 'OOOOODDDDDDDDDDDDDDDDO',
    mws: [null,null,null,null,null,0.6,1.7,2.8,4.3,4.7,4.5,4.1,3.9,3.6,3.7,4.0,4.2,4.0,3.0,2.5,1.6,0.6,null],
  },
  {
    source: 'BESS Discharge',
    codes: 'OOOOOOOOOOOOOXXXXXXOOOX',
    mws: [null,null,null,null,null,null,null,null,null,null,null,null,null,0.5,0.5,0.6,0.6,0.5,0.5,null,null,null,0.6],
  },
  {
    source: 'BESS Charge',
    codes: 'OCCCCOOOOOOOOOOOOOOOOO',
    mws: [null,0.7,0.8,0.9,0.8,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
  },
]

export const mockDispatch: DispatchRow[] = RAW.map(({ source, codes, mws }) => ({
  source,
  cells: Array.from(codes).map((code, i): DispatchCell => ({
    mode: MODES[code],
    mw: mws[i],
  })),
}))

export const GANTT_HOURS = Array.from({ length: 23 }, (_, i) => String(i).padStart(2, '0'))
