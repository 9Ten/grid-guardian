import type { ForecastPoint } from '../types'

const FORECAST_RAW = [5.3,4.9,4.6,4.4,4.3,4.5,5.0,5.7,6.5,6.9,7.5,7.9,7.5,7.2,7.0,7.3,7.6,7.9,8.1,8.3,8.0,7.5,6.9,6.3]
const ACTUAL_RAW   = [5.2,4.8,4.5,4.3,4.2,4.4,5.1,5.8,6.4,7.0,7.6,7.8,7.4,7.1,6.9,7.3,7.4,null,null,null,null,null,null,null]

export const mockForecast: ForecastPoint[] = FORECAST_RAW.map((fc, i) => ({
  hour: i,
  label: `${String(i).padStart(2, '0')}:00`,
  actual: ACTUAL_RAW[i],
  forecast: fc,
  upper: +(fc + 1.2).toFixed(1),
  lower: +(fc - 1.2).toFixed(1),
}))
