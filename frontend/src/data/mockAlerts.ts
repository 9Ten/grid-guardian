import type { Alert } from '../types'

export const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    severity: 'critical',
    title: '⚡ Grid Capacity Alert',
    body: 'โหลดจะเกิน main grid limit (5 MW) ช่วง 18:00–22:00 — ต้องเปิด Diesel Unit 2 อีก 2.5 MW',
    time: 'ตรวจพบ 15:42 | อีก 1h 48m',
    primaryAction: 'DISPATCH DIESEL',
    secondaryAction: 'ACK',
  },
  {
    id: 'alert-2',
    severity: 'warning',
    title: '🔋 BESS SOC Declining',
    body: 'BESS SOC ลดลงเร็วกว่าคาด — ควรหยุด discharge และเตรียม charge จาก grid ช่วง 02:00–05:00',
    time: 'ตรวจพบ 15:38 | Priority: MEDIUM',
    secondaryAction: 'ACKNOWLEDGE',
  },
  {
    id: 'alert-3',
    severity: 'info',
    title: '📋 Schedule Advisory',
    body: 'Optimizer แนะนำ: ลด Diesel output เหลือ 1.5 MW ช่วง 10:00–14:00 เพื่อใช้ grid excess power สูง — ประหยัดได้ ~฿18,600',
    time: '15:30 | Cost Saving Opportunity',
    secondaryAction: 'REVIEW SCHEDULE',
  },
]
