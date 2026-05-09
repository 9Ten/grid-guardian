// Typed async stubs — swap return bodies to fetch() calls when backend is ready

import type { ForecastPoint, DispatchRow, Alert, SourceMeter, AgentSession } from '../types'
import { mockForecast } from '../data/mockForecast'
import { mockDispatch }  from '../data/mockDispatch'
import { mockAlerts }    from '../data/mockAlerts'
import { mockMeters }    from '../data/mockMeters'
import { mockAgent }     from '../data/mockAgent'

export async function getForecastData(): Promise<ForecastPoint[]> {
  return mockForecast
}

export async function getDispatchSchedule(): Promise<DispatchRow[]> {
  return mockDispatch
}

export async function getAlerts(): Promise<Alert[]> {
  return mockAlerts
}

export async function getSourceMeters(): Promise<SourceMeter[]> {
  return mockMeters
}

export async function getAgentSession(): Promise<AgentSession> {
  return mockAgent
}
