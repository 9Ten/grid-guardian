import { useEffect, useState } from 'react'

export default function Header() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header
      className="flex items-center justify-between px-5 py-2.5 sticky top-0 z-50 border-b"
      style={{
        background: 'linear-gradient(90deg, rgba(0,15,35,0.95) 0%, rgba(0,30,60,0.9) 100%)',
        borderColor: 'rgba(0,180,255,0.25)',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3.5">
        <span
          className="font-display font-bold text-sm tracking-widest px-2.5 py-0.5"
          style={{ background: '#00cfff', color: '#000' }}
        >
          PEA EMS
        </span>
        <div>
          <div className="font-display font-bold text-lg tracking-wide text-white">
            KOH TAO ENERGY MANAGEMENT SYSTEM
          </div>
          <div className="text-[11px] tracking-wide" style={{ color: '#4a7a9b' }}>
            ศูนย์ควบคุมการจ่ายไฟ — การไฟฟ้าส่วนภูมิภาค เขต 2 ภาคใต้
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-5">
        <KpiStat value="7.4 MW" label="CURRENT LOAD" valueClass="text-gg-amber" />
        <KpiStat value="8.1 MW" label="FORECAST +2H"  valueClass="text-gg-red"   />
        <KpiStat value="68%"    label="BESS SOC"       valueClass="text-gg-green" />
        <div>
          <div className="flex items-center">
            <span
              className="inline-block w-2 h-2 rounded-full mr-1.5 animate-pulse-dot"
              style={{ background: '#00e676', boxShadow: '0 0 8px #00e676' }}
            />
            <span className="font-mono text-[22px] tracking-widest" style={{ color: '#00cfff' }}>
              {time || '--:--:--'}
            </span>
          </div>
          <div className="text-[10px] text-right tracking-wide" style={{ color: '#4a7a9b' }}>
            LIVE
          </div>
        </div>
      </div>
    </header>
  )
}

function KpiStat({ value, label, valueClass }: { value: string; label: string; valueClass: string }) {
  return (
    <div className="text-center">
      <div className={`font-mono text-base ${valueClass}`}>{value}</div>
      <div className="text-[10px] tracking-wide" style={{ color: '#4a7a9b' }}>{label}</div>
    </div>
  )
}
