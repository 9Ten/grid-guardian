// Shapes mirror backend API responses — swap src/api/index.ts to use real fetch later

export interface ForecastPoint {
  hour: number        // 0-23
  label: string       // '00:00' ... '23:00'
  actual: number | null   // null for future hours
  forecast: number
  upper: number       // forecast + confidence
  lower: number       // forecast - confidence
}

export type DispatchMode = 'grid' | 'diesel' | 'bess_discharge' | 'bess_charge' | 'off'

export interface DispatchCell {
  mode: DispatchMode
  mw: number | null
}

export interface DispatchRow {
  source: string
  cells: DispatchCell[]  // length 23, hours 0-22
}

export type AlertSeverity = 'critical' | 'warning' | 'info'

export interface Alert {
  id: string
  severity: AlertSeverity
  title: string
  body: string
  time: string
  primaryAction?: string
  secondaryAction?: string
}

export type MeterStatus = 'on' | 'warn' | 'off' | 'rdy'
export type MeterColor = 'grid' | 'diesel' | 'bess'

export interface SourceMeter {
  name: string
  mw: number
  maxMw: number
  status: MeterStatus
  color: MeterColor
}

export type ToolStatus = 'done' | 'running' | 'waiting'

export interface ToolCall {
  status: ToolStatus
  name: string
  result: string
}

export interface ReasonStep {
  text: string   // may contain <b> tags for emphasis
}

export type ActionCardType = 'primary' | 'secondary'

export interface ActionCard {
  type: ActionCardType
  title: string
  body: string
  saving: string
}

export interface AgentSession {
  toolCalls: ToolCall[]
  reasoning: ReasonStep[]
  actions: ActionCard[]
}
