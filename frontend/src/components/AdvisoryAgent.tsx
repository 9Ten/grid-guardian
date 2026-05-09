import { useState } from 'react'
import type { ToolCall, ReasonStep, ActionCard, ToolStatus, ActionCardType } from '../types'
import { mockAgent } from '../data/mockAgent'

const TOOL_ICON: Record<ToolStatus, { symbol: string; style: React.CSSProperties }> = {
  done:    { symbol: '✓', style: { background: 'rgba(0,230,118,0.15)', color: '#00e676' } },
  running: { symbol: '⟳', style: { background: 'rgba(255,171,0,0.15)', color: '#ffab00' } },
  waiting: { symbol: '○', style: { background: 'rgba(74,122,155,0.15)', color: '#4a7a9b' } },
}

const ACTION_STYLE: Record<ActionCardType, { border: string; bg: string; titleColor: string }> = {
  primary:   { border: 'rgba(0,207,255,0.4)',   bg: 'rgba(0,207,255,0.05)',   titleColor: '#00cfff' },
  secondary: { border: 'rgba(0,230,118,0.3)',   bg: 'rgba(0,230,118,0.04)',   titleColor: '#00e676' },
}

export default function AdvisoryAgent() {
  const [approved, setApproved] = useState(false)
  const { toolCalls, reasoning, actions } = mockAgent

  return (
    <div
      className="animate-fade-in flex flex-col"
      style={{
        background: '#0b1629',
        border: '1px solid rgba(124,58,237,0.3)',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
      }}
    >
      {/* gradient top line */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, #7c3aed, #00cfff, transparent)',
          opacity: 0.6,
        }}
      />

      {/* header */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5"
        style={{
          borderBottom: '1px solid rgba(124,58,237,0.2)',
          background: 'rgba(124,58,237,0.06)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-sm shrink-0 animate-agent-icon"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #00cfff)' }}
          >
            ⚡
          </div>
          <div>
            <div className="font-display font-bold text-sm tracking-wide" style={{ color: '#c4b5fd' }}>
              ADVISORY AGENT
            </div>
            <div className="text-[10px] tracking-wide" style={{ color: '#4a7a9b' }}>
              AI ORCHESTRATOR · READ-ONLY
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="animate-bounce-1 inline-block w-1.5 h-1.5 rounded-full" style={{ background: '#7c3aed' }} />
          <span className="animate-bounce-2 inline-block w-1.5 h-1.5 rounded-full" style={{ background: '#7c3aed' }} />
          <span className="animate-bounce-3 inline-block w-1.5 h-1.5 rounded-full" style={{ background: '#7c3aed' }} />
        </div>
      </div>

      {/* scrollable body */}
      <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-4">

        <Section title="Tool Calls">
          {toolCalls.map((tc, i) => <ToolCallRow key={i} tc={tc} />)}
        </Section>

        <Section title="Reasoning">
          {reasoning.map((step, i) => <ReasonRow key={i} n={i + 1} step={step} />)}
        </Section>

        <Section title="Recommended Actions">
          {actions.map((card, i) => <ActionCardView key={i} card={card} />)}
        </Section>

        <Section title="Engineer Decision">
          <button
            className="w-full py-1.5 text-[11px] font-display font-bold tracking-wide transition-colors"
            style={{
              background: approved ? '#00e676' : '#00cfff',
              color: '#000',
              border: 'none',
            }}
            onClick={() => setApproved(true)}
          >
            {approved ? '✓ APPROVED — Dispatching...' : 'APPROVE & DISPATCH DIESEL UNIT 2'}
          </button>
          <button
            className="w-full mt-1 py-1 text-[10px] font-display tracking-wide transition-colors"
            style={{
              background: 'transparent',
              color: '#4a7a9b',
              border: '1px solid rgba(0,180,255,0.12)',
            }}
          >
            MODIFY SCHEDULE
          </button>
          <p className="text-[10px] mt-2 leading-relaxed" style={{ color: '#4a7a9b' }}>
            Agent จะส่ง recommendation เท่านั้น — การ dispatch ต้องได้รับ approval จากวิศวกรก่อนทุกครั้ง
          </p>
        </Section>

        <Section title="Ask Agent">
          {[
            'ถ้าไม่เปิด Diesel Unit 2 จะเกิดอะไร?',
            'BESS จะหมดที่เมื่อคืนค่าไม่การ?',
            'ตอนนี้ต้องใช้น้ำมันกี่ลิตรคืนนี้?',
          ].map(q => (
            <button
              key={q}
              className="w-full text-left text-[10px] px-2 py-1.5 mb-1.5 transition-colors"
              style={{
                background: 'rgba(124,58,237,0.1)',
                border: '1px solid rgba(124,58,237,0.2)',
                color: '#c4b5fd',
              }}
            >
              {q}
            </button>
          ))}
          <div className="flex gap-1.5 mt-1">
            <input
              className="flex-1 text-[12px] px-3 py-1.5 outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(124,58,237,0.25)',
                color: '#cce8ff',
              }}
              placeholder="ถามเพิ่มเติมถึง Agent..."
            />
            <button
              className="font-display font-bold text-[11px] tracking-wide px-3 py-1.5"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', color: '#fff', border: 'none' }}
            >
              ASK →
            </button>
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        className="font-display font-bold text-[11px] tracking-widest uppercase mb-2"
        style={{ color: '#7c3aed' }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

function ToolCallRow({ tc }: { tc: ToolCall }) {
  const { symbol, style } = TOOL_ICON[tc.status]
  return (
    <div className="flex items-start gap-2 mb-2 text-[11px]">
      <div
        className="w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold"
        style={style}
      >
        {symbol}
      </div>
      <div>
        <div className="font-mono" style={{ color: '#c4b5fd' }}>{tc.name}</div>
        <div className="text-[10px] mt-0.5" style={{ color: tc.status === 'running' ? '#ffab00' : '#4a7a9b' }}>
          {tc.result}
        </div>
      </div>
    </div>
  )
}

function ReasonRow({ n, step }: { n: number; step: ReasonStep }) {
  return (
    <div className="flex gap-2 mb-2 text-[11px] leading-relaxed">
      <div
        className="w-4 h-4 rounded-full flex items-center justify-center font-mono text-[9px] shrink-0 mt-0.5"
        style={{
          background: 'rgba(124,58,237,0.2)',
          border: '1px solid rgba(124,58,237,0.4)',
          color: '#c4b5fd',
        }}
      >
        {n}
      </div>
      {/* dangerouslySetInnerHTML is safe here — content is hardcoded mock data, not user input */}
      <div style={{ color: '#4a7a9b' }} dangerouslySetInnerHTML={{ __html: step.text }} />
    </div>
  )
}

function ActionCardView({ card }: { card: ActionCard }) {
  const { border, bg, titleColor } = ACTION_STYLE[card.type]
  return (
    <div
      className="rounded-sm px-3 py-2.5 mb-2"
      style={{ border: `1px solid ${border}`, background: bg }}
    >
      <div className="font-display font-bold text-[12px] mb-1" style={{ color: titleColor }}>
        {card.title}
      </div>
      <div className="text-[11px] leading-relaxed" style={{ color: '#4a7a9b' }}>
        {card.body}
      </div>
      <div className="font-mono text-[11px] mt-1" style={{ color: '#00e676' }}>
        {card.saving}
      </div>
    </div>
  )
}
