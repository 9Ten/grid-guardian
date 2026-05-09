export default function AlertStrip() {
  return (
    <div
      className="flex items-center gap-3 px-5 py-1.5 text-[12px]"
      style={{
        background: 'linear-gradient(90deg, rgba(255,61,87,0.15) 0%, transparent 100%)',
        borderLeft: '3px solid #ff3d57',
        color: '#ffb3bc',
      }}
    >
      <span
        className="font-display font-bold text-[11px] px-2 py-0.5 tracking-widest text-white"
        style={{ background: '#ff3d57' }}
      >
        ⚠ EARLY WARNING
      </span>
      <span className="flex-1">
        จากการพยากรณ์ภาระไฟฟ้าจะเกิน Main Grid capacity ใน 2 ชั่วโมง (18:00–22:00)
        — แนะนำเปิด Diesel Unit 2 เพิ่ม 2.5 MW ก่อน 17:30
      </span>
      <button
        className="font-display font-semibold text-[11px] tracking-wide px-3.5 py-1 transition-colors"
        style={{ border: '1px solid #ff3d57', color: '#ff3d57', background: 'transparent' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#ff3d57'; (e.currentTarget as HTMLButtonElement).style.color = '#fff' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#ff3d57' }}
      >
        VIEW DETAIL
      </button>
    </div>
  )
}
