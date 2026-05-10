import { useState } from 'react'
import { Bot, Factory, BatteryCharging, Droplets, ChevronRight } from 'lucide-react'

const PRESET_QUESTIONS = [
  {
    icon: Factory,
    question: 'ถ้าไม่มี Diesel Unit 2 จะเกิดอะไร?',
    response:
      'หากไม่มี Diesel Unit 2 กำลังการผลิตสูงสุดจะลดลงประมาณ 1.2 MW BESS จะหมดพลังงานภายใน 19:00 น. และค่าใช้จ่ายในการนำเข้าไฟฟ้าจากกริดจะเพิ่มขึ้นประมาณ ฿4,200 ต่อคืน',
  },
  {
    icon: BatteryCharging,
    question: 'BESS จะช่วยแก้ไขอย่างไรบ้าง?',
    response:
      'BESS ถูกกำหนดให้จ่ายพลังงาน 0.8 MW ในช่วงเวลาพีค 18:00–22:00 น. ซึ่งช่วยประหยัดค่าเชื้อเพลิงดีเซลได้ประมาณ ฿3,100 ในคืนนี้',
  },
  {
    icon: Droplets,
    question: 'คาดว่าต้องใช้น้ำมันกี่ลิตรคืนนี้?',
    response:
      'คาดการณ์การใช้ดีเซลคืนนี้ประมาณ 680 ลิตร จาก Unit 1 และ Unit 2 รวมกัน คิดเป็นค่าใช้จ่ายประมาณ ฿19,040 (กรณีที่ BESS ทำงานปกติ)',
  },
]

const FALLBACK_RESPONSE =
  'ขณะนี้ระบบกริดทำงานอยู่ในพารามิเตอร์ปกติ หากต้องการการวิเคราะห์เพิ่มเติม กรุณาตรวจสอบตารางการจ่ายพลังงานด้านบน'

export default function AskAgentCard() {
  const [inputValue, setInputValue] = useState('')
  const [response, setResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleSubmit() {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    setLoading(true)
    setResponse(null)
    const matched = PRESET_QUESTIONS.find(q => q.question === trimmed)
    setTimeout(() => {
      setResponse(matched ? matched.response : FALLBACK_RESPONSE)
      setLoading(false)
    }, 800)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="bg-white rounded border border-gray-200 shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex flex-col px-3 py-2 bg-pea-700 rounded-t">
        <div className="flex items-center gap-1.5">
          <Bot size={14} className="text-white shrink-0" />
          <span className="text-[11px] font-bold text-white tracking-wider uppercase">Ask Agent</span>
        </div>
        <span className="text-[9px] text-pea-200 mt-0.5 leading-snug">
          ถามเพิ่มเติมเกี่ยวกับสถานการณ์พลังงานตอนนี้
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Preset chips */}
      <div className="flex flex-col gap-1 p-2">
        {PRESET_QUESTIONS.map(({ icon: Icon, question }) => (
          <button
            key={question}
            onClick={() => setInputValue(question)}
            className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded border border-gray-100 hover:bg-indigo-50 hover:border-indigo-200 transition-colors group"
          >
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 group-hover:bg-indigo-200 shrink-0 transition-colors">
              <Icon size={11} className="text-pea-700" />
            </span>
            <span className="text-[10px] text-gray-700 flex-1 leading-snug">{question}</span>
            <ChevronRight size={11} className="text-gray-400 shrink-0" />
          </button>
        ))}
      </div>

      {/* Mock response */}
      {(loading || response) && (
        <div className="mx-2 mb-2 p-2 bg-indigo-50 border border-indigo-100 rounded flex gap-1.5">
          <Bot size={11} className="text-pea-700 shrink-0 mt-0.5" />
          <p className="text-[10px] text-gray-700 leading-snug">
            {loading ? 'กำลังวิเคราะห์…' : response}
          </p>
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-1.5 px-2 pb-2">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="พิมพ์คำถามถึง Agent…"
          className="flex-1 text-[10px] border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-pea-500 placeholder:text-gray-400"
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="text-[10px] font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 px-2.5 py-1.5 rounded transition-colors shrink-0"
        >
          ASK ↗
        </button>
      </div>
    </div>
  )
}
