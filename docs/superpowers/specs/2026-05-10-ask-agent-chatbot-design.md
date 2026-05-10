# AskAgentCard — Design Spec
**Date:** 2026-05-10

## Summary

Add a static `AskAgentCard` component to the right column of the dashboard, below `CostAnalysisCard`. The component displays preset question chips and a free-text input. Submitting any question shows a hardcoded mock response after a brief simulated delay. No real API call is made.

---

## Placement

- **File:** `frontend/src/components/AskAgentCard.tsx`
- **Dashboard location:** `DashboardPage.tsx` right column, third card (after `EarlyWarningPanel` and `CostAnalysisCard`)

---

## Visual Structure

```
┌─────────────────────────────────────────┐
│ [Bot icon]  ASK AGENT          (purple) │
│             ถามเพิ่มเติมเกี่ยวกับ...   │
├─────────────────────────────────────────┤
│ [🏭] ถ้าไม่มี Diesel Unit 2 จะเกิดอะไร? >│
│ [🔋] BESS จะช่วยแก้ไขอย่างไรบ้าง?       >│
│ [💧] คาดว่าต้องใช้น้ำมันกี่ลิตรคืนนี้?  >│
├─────────────────────────────────────────┤
│ [mock response box — shown after submit]│
├─────────────────────────────────────────┤
│ [พิมพ์คำถามถึง Agent…]      [ASK ↗]    │
└─────────────────────────────────────────┘
```

---

## Styling

- Card shell: `bg-white rounded border border-gray-200 shadow-sm flex flex-col` (matches existing right-column cards)
- Header: `bg-pea-700` purple background, white text — matches `EarlyWarningPanel` header
- Preset chips: `bg-indigo-50` icon badge, full-width row with `ChevronRight`, hover highlight
- Response box: `bg-indigo-50 border border-indigo-100 rounded`, `Bot` icon + Thai response text at `text-[11px]`
- Input: standard border input, purple `ASK ↗` button (`bg-violet-600 hover:bg-violet-700`)

---

## Lucide Icons

| Chip | Icon |
|------|------|
| Diesel Unit 2 | `Factory` |
| BESS | `BatteryCharging` |
| Fuel | `Droplets` |
| Header & response | `Bot` |
| Chip arrow | `ChevronRight` |

---

## State

```ts
const [inputValue, setInputValue] = useState('')
const [response, setResponse] = useState<string | null>(null)
const [loading, setLoading] = useState(false)
```

- Clicking a chip sets `inputValue` to the chip's Thai question text
- Submitting (button click or Enter key) sets `loading = true`, waits ~800ms, then sets `response` to the matched mock answer and `loading = false`
- The response box is hidden when `response === null`

---

## Preset Questions & Mock Responses

| Question | Mock Response |
|----------|--------------|
| ถ้าไม่มี Diesel Unit 2 จะเกิดอะไร? | หากไม่มี Diesel Unit 2 กำลังการผลิตสูงสุดจะลดลงประมาณ 1.2 MW BESS จะหมดพลังงานภายใน 19:00 น. และค่าใช้จ่ายในการนำเข้าไฟฟ้าจากกริดจะเพิ่มขึ้นประมาณ ฿4,200 ต่อคืน |
| BESS จะช่วยแก้ไขอย่างไรบ้าง? | BESS ถูกกำหนดให้จ่ายพลังงาน 0.8 MW ในช่วงเวลาพีค 18:00–22:00 น. ซึ่งช่วยประหยัดค่าเชื้อเพลิงดีเซลได้ประมาณ ฿3,100 ในคืนนี้ |
| คาดว่าต้องใช้น้ำมันกี่ลิตรคืนนี้? | คาดการณ์การใช้ดีเซลคืนนี้ประมาณ 680 ลิตร จาก Unit 1 และ Unit 2 รวมกัน คิดเป็นค่าใช้จ่ายประมาณ ฿19,040 (กรณีที่ BESS ทำงานปกติ) |
| (any other input) | ขณะนี้ระบบกริดทำงานอยู่ในพารามิเตอร์ปกติ หากต้องการการวิเคราะห์เพิ่มเติม กรุณาตรวจสอบตารางการจ่ายพลังงานด้านบน |

---

## Files Changed

1. `frontend/src/components/AskAgentCard.tsx` — new file
2. `frontend/src/pages/DashboardPage.tsx` — add import and render `<AskAgentCard />` in the right column
