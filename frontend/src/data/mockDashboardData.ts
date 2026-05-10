import type {
  KpiCardData,
  HourlyDispatch,
  LoadForecastPoint,
  BessSocPoint,
  PowerSource,
  AlertItem,
  CostBreakdownItem,
} from '../types'

export const SERIES_COLORS = {
  gridImport:    '#3b4ba8',
  dieselPower:   '#ef4444',
  bessDischarge: '#22c55e',
  bessCharge:    '#6366f1',
  solarPV:       '#f59e0b',
} as const

export const PEA_PURPLE = '#6d28d9'

// ---------------------------------------------------------------------------
// Scenario 6 — "Smart Dispatch, single-day zoom of stress test"
// Source: app/optimizer.py  _STRESS_DAY_LOAD / _STRESS_DAY_PV / _STRESS_DAY_GRID
// All dispatch values taken directly from HiGHS optimal solution.
// Grid cap: 12 MW hours 7–15 (t=8–16 in Python), 4 MW otherwise.
// ---------------------------------------------------------------------------

// Exact p_grid values from optimizer dispatch table (hours 0–23)
const GRID_IMPORT    = [4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 12.0, 12.0, 12.0, 12.0, 12.0, 12.0, 12.0, 12.0, 12.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0]
// Exact p_gen values (diesel online at hours 0–1 and 17–22)
const DIESEL_POWER   = [3.0, 3.8, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 7.52, 9.0, 10.0, 9.5, 8.5, 3.19, 0.0]
// Exact p_dis values (BESS discharges overnight 0–6, then afternoon dip 16, 22–23)
const BESS_DISCHARGE = [1.20, 0.0, 3.49, 3.27, 3.10, 3.52, 4.12, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 6.12, 0.0, 0.0, 0.0, 0.0, 0.0, 3.31, 5.20]
// Exact p_ch values (BESS charges from midday grid+PV surplus, hours 7–15)
const BESS_CHARGE    = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 3.39, 3.23, 3.83, 4.62, 5.0, 5.12, 4.63, 3.93, 3.19, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
// PV derived from power-balance: supply = grid + diesel + PV + dis = load + charge
const SOLAR_PV       = [0.0, 0.0, 0.01, 0.03, 0.10, 0.28, 0.68, 1.39, 2.43, 3.63, 4.62, 5.0, 4.62, 3.63, 2.43, 1.39, 0.68, 0.28, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]

export const dispatchSchedule: HourlyDispatch[] = Array.from({ length: 24 }, (_, i) => ({
  hour:          i,
  gridImport:    GRID_IMPORT[i],
  dieselPower:   DIESEL_POWER[i],
  bessDischarge: BESS_DISCHARGE[i],
  bessCharge:    BESS_CHARGE[i],
  solarPV:       SOLAR_PV[i],
}))

// Load from _STRESS_DAY_LOAD; tariff = DEFAULT_TOU = 4,000 THB/MWh; CI ±0.7 MW
export const loadForecastData: LoadForecastPoint[] = [
  { hour: 0,  tariff: 4000, load: 8.2,  loadLow: 7.5,  loadHigh: 8.9  },
  { hour: 1,  tariff: 4000, load: 7.8,  loadLow: 7.1,  loadHigh: 8.5  },
  { hour: 2,  tariff: 4000, load: 7.5,  loadLow: 6.8,  loadHigh: 8.2  },
  { hour: 3,  tariff: 4000, load: 7.3,  loadLow: 6.6,  loadHigh: 8.0  },
  { hour: 4,  tariff: 4000, load: 7.2,  loadLow: 6.5,  loadHigh: 7.9  },
  { hour: 5,  tariff: 4000, load: 7.8,  loadLow: 7.1,  loadHigh: 8.5  },
  { hour: 6,  tariff: 4000, load: 8.8,  loadLow: 8.0,  loadHigh: 9.6,  earlyWarning: 'warning'  },
  { hour: 7,  tariff: 4000, load: 10.0, loadLow: 9.1,  loadHigh: 10.9 },
  { hour: 8,  tariff: 4000, load: 11.2, loadLow: 10.2, loadHigh: 12.2 },
  { hour: 9,  tariff: 4000, load: 11.8, loadLow: 10.7, loadHigh: 12.9 },
  { hour: 10, tariff: 4000, load: 12.0, loadLow: 10.9, loadHigh: 13.1, earlyWarning: 'info'     },
  { hour: 11, tariff: 4000, load: 12.0, loadLow: 10.9, loadHigh: 13.1 },
  { hour: 12, tariff: 4000, load: 11.5, loadLow: 10.5, loadHigh: 12.5 },
  { hour: 13, tariff: 4000, load: 11.0, loadLow: 10.0, loadHigh: 12.0 },
  { hour: 14, tariff: 4000, load: 10.5, loadLow: 9.6,  loadHigh: 11.4 },
  { hour: 15, tariff: 4000, load: 10.2, loadLow: 9.3,  loadHigh: 11.1 },
  { hour: 16, tariff: 4000, load: 10.8, loadLow: 9.8,  loadHigh: 11.8 },
  { hour: 17, tariff: 4000, load: 11.8, loadLow: 10.7, loadHigh: 12.9 },
  { hour: 18, tariff: 4000, load: 13.0, loadLow: 11.8, loadHigh: 14.2, earlyWarning: 'critical' },
  { hour: 19, tariff: 4000, load: 14.0, loadLow: 12.7, loadHigh: 15.3 },
  { hour: 20, tariff: 4000, load: 13.5, loadLow: 12.3, loadHigh: 14.7 },
  { hour: 21, tariff: 4000, load: 12.5, loadLow: 11.4, loadHigh: 13.6 },
  { hour: 22, tariff: 4000, load: 10.5, loadLow: 9.6,  loadHigh: 11.4 },
  { hour: 23, tariff: 4000, load: 9.2,  loadLow: 8.4,  loadHigh: 10.0 },
]

// SoC from optimizer (model.SoC[t] × 100), soc_init = 0.50 → ends at 0.500
export const bessSocData: BessSocPoint[] = [
  { hour: 0,  soc: 47.5 }, { hour: 1,  soc: 47.5 }, { hour: 2,  soc: 40.1 },
  { hour: 3,  soc: 33.2 }, { hour: 4,  soc: 26.7 }, { hour: 5,  soc: 19.3 },
  { hour: 6,  soc: 10.6 }, { hour: 7,  soc: 17.1 }, { hour: 8,  soc: 23.2 },
  { hour: 9,  soc: 30.5 }, { hour: 10, soc: 39.3 }, { hour: 11, soc: 48.8 },
  { hour: 12, soc: 58.5 }, { hour: 13, soc: 67.3 }, { hour: 14, soc: 74.7 },
  { hour: 15, soc: 80.8 }, { hour: 16, soc: 67.9 }, { hour: 17, soc: 67.9 },
  { hour: 18, soc: 67.9 }, { hour: 19, soc: 67.9 }, { hour: 20, soc: 67.9 },
  { hour: 21, soc: 67.9 }, { hour: 22, soc: 60.9 }, { hour: 23, soc: 50.0 },
]

// Total cost 1,610,019 THB; cost saving vs all-diesel baseline (250.1 MWh × 13,000 = 3,251,300)
// CO₂ saved: (250.10 − 54.51) MWh diesel × 0.71 t/MWh ≈ 138.9 t
export const kpiCards: KpiCardData[] = [
  { label: 'TOTAL COST',    value: '฿1,610,019', color: 'text-indigo-700' },
  { label: 'COST SAVING',   value: '฿1,641,281', color: 'text-green-600'  },
  { label: 'CO₂ REDUCTION', value: '138.9 ton',  color: 'text-purple-700' },
  { label: 'DIESEL',        value: '54.51 MWh',  color: 'text-red-600'   },
]

// Current hour = 14 (NOW marker): diesel OFF, BESS charging 3.93 MW, grid at 12 MW cap, PV 2.43 MW
export const powerSources: PowerSource[] = [
  { id: 'fuel',    label: 'Diesel Fuel',              value: '14,717', unit: 'L',  statusLabel: ''    },
  { id: 'diesel',  label: 'Diesel Power Generator',   value: '0.00',   unit: 'MW', statusLabel: 'ปกติ' },
  { id: 'bessChg', label: 'BESS (Charge)',             value: '3.93',   unit: 'MW', statusLabel: 'ปกติ' },
  { id: 'bessDis', label: 'BESS (Discharge)',            value: '0.00',   unit: 'MW', statusLabel: 'ปกติ' },
  { id: 'import',  label: 'Grid Import', value: '12.00',  unit: 'MW', statusLabel: 'ปกติ' },
  { id: 'solar',   label: 'Solar PV',               value: '2.43',   unit: 'MW', statusLabel: 'ปกติ' },
]

export const alerts: AlertItem[] = [
  {
    id: '1',
    severity: 'critical',
    title: 'Grid Capacity Alert',
    detail: 'คาดโหลดจะเกิน main grid limit (5 MW) ช่วง 18:00–22:00 — ต้องเพิ่ม Diesel Unit 2 อีก 2.5 MW',
    time: 'ตรวจพบ',
    timeLabel: 'ผลกระทบใน 1h 48m',
    actionLabel: 'DISPATCH DIESEL',
  },
  {
    id: '2',
    severity: 'warning',
    title: 'BESS SOC Declining',
    detail: 'BESS SOC ลดลงเร็วกว่าแผน — ควรหยุด discharge และเตรียม charge จาก grid ในช่วง 02:00–05:00',
    time: 'ตรวจพบ',
    timeLabel: '',
    actionLabel: 'ACKNOWLEDGE',
  },
  {
    id: '3',
    severity: 'info',
    title: 'Schedule Advisory',
    detail: 'Optimizer แนะนำ: ลด Diesel output เหลือ 1.5 MW ช่วง 10:00–14:00 เนื่องจาก grid excess power สูง — ประหยัดได้ ~฿18,600',
    time: 'ตรวจพบ',
    timeLabel: 'Cost Saving Opportunity',
    actionLabel: 'REVIEW SCHEDULE',
  }
]

// Exact cost breakdown from optimizer: C_DG + C_GRID + C_BESS + C_PENALTY = 1,610,019 THB
export const costBreakdown: CostBreakdownItem[] = [
  { name: 'Fuel Cost',     value: 832600,  color: '#ef4444' },
  { name: 'Grid Cost',     value: 672000,  color: '#3b4ba8' },
  { name: 'BESS O&M',      value: 105419,  color: '#22c55e' },
  { name: 'Load Shedding', value: 0,       color: '#f59e0b' },
]

// ---------------------------------------------------------------------------
// Optimized scenario — "BESS-only, no diesel" (applied via Apply button)
// Diesel zeroed out; BESS discharge compensates at overnight + evening hours.
// Grid import and solar unchanged. Assumes expanded BESS capacity for demo.
// ---------------------------------------------------------------------------

const OPT_BESS_DISCHARGE = [
  4.20, 3.80, 3.49, 3.27, 3.10, 3.52, 4.12,    // 0–6: heavy overnight discharge
  0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, // 7–15: charging from solar/grid
  6.12,                                           // 16: afternoon dip
  7.52, 9.00, 10.00, 9.50, 8.50, 6.50, 5.20,    // 17–23: cover peak, no diesel
]

export const optimizedDispatchSchedule: HourlyDispatch[] = Array.from({ length: 24 }, (_, i) => ({
  hour:          i,
  gridImport:    GRID_IMPORT[i],
  dieselPower:   0,
  bessDischarge: OPT_BESS_DISCHARGE[i],
  bessCharge:    BESS_CHARGE[i],
  solarPV:       SOLAR_PV[i],
}))

export const optimizedBessSocData: BessSocPoint[] = [
  { hour: 0,  soc: 44.5 }, { hour: 1,  soc: 35.0 }, { hour: 2,  soc: 27.5 },
  { hour: 3,  soc: 20.5 }, { hour: 4,  soc: 14.0 }, { hour: 5,  soc: 6.5  },
  { hour: 6,  soc: 0.5  }, { hour: 7,  soc: 7.5  }, { hour: 8,  soc: 14.0 },
  { hour: 9,  soc: 22.5 }, { hour: 10, soc: 32.0 }, { hour: 11, soc: 42.5 },
  { hour: 12, soc: 54.0 }, { hour: 13, soc: 65.0 }, { hour: 14, soc: 75.5 },
  { hour: 15, soc: 83.0 }, { hour: 16, soc: 70.5 }, { hour: 17, soc: 54.0 },
  { hour: 18, soc: 35.5 }, { hour: 19, soc: 14.5 }, { hour: 20, soc: 0.5  },
  { hour: 21, soc: 0.0  }, { hour: 22, soc: 0.0  }, { hour: 23, soc: 0.0  },
]