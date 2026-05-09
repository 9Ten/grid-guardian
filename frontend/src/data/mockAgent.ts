import type { AgentSession } from '../types'

export const mockAgent: AgentSession = {
  toolCalls: [
    { status: 'done',    name: 'get_load_forecast()',        result: 'Peak 8.3 MW @ 19:00 · MAPE 6.2%' },
    { status: 'done',    name: 'get_grid_status()',          result: 'Main grid 4.3 MW · headroom +0.6 MW' },
    { status: 'done',    name: 'get_bess_state()',           result: 'SOC 68% · 34 MWh available' },
    { status: 'done',    name: 'run_optimization(constraints)', result: 'Schedule generated · saving ฿18,600/day' },
    { status: 'running', name: 'check_incident_risk()',      result: 'Running... bottleneck window analysis' },
    { status: 'waiting', name: 'calculate_fuel_forecast()', result: 'Waiting...' },
  ],
  reasoning: [
    { text: 'โหลด forecast <b>8.3 MW @ 19:00</b> เกิน main grid limit (5.0 MW) — ต้องใช้ backup sources' },
    { text: 'BESS SOC 68% = <b>34 MWh available</b> — เพียงพอรองรับ peak 3–4 ชั่วโมง แต่ควรสำรองไว้สำหรับ emergency' },
    { text: 'Diesel Unit 2 (idle) สามารถ ramp up ได้ใน <b>~15 นาที</b> — ต้องสั่งก่อน 17:30 เพื่อให้พร้อมทัน 18:00' },
    { text: 'Cost comparison: Diesel (+2.5 MW × 4h × ฿13) = <b>฿130,000</b> vs BESS discharge (฿0 fuel) = <b>฿0</b>' },
    { text: 'Grid constraint: ไม่กระทบ Koh Samui/Phangan — Diesel Unit 2 is <b>island-local</b> — ไม่กระทบ bottleneck' },
  ],
  actions: [
    {
      type: 'primary',
      title: '⚡ เปิด Diesel Unit 2 ก่อน 17:30',
      body: 'เพิ่ม output 2.5 MW รองรับ peak 18:00–22:00 · ไม่กระทบ bottleneck สาย 115kV',
      saving: 'ป้องกัน blackout risk · cost ฿130,000',
    },
    {
      type: 'secondary',
      title: '📋 ลด Diesel Unit 1 ช่วง 10:00–14:00',
      body: 'Grid excess สูง — ลด diesel เหลือ 1.5 MW แล้วการ charge BESS แทน',
      saving: 'ประหยัด ฿18,600 · BESS SOC +12%',
    },
  ],
}
