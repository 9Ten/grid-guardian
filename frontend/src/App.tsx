import Header from './components/Header'
import AlertStrip from './components/AlertStrip'
import EnergySourceStatus from './components/EnergySourceStatus'

export default function App() {
  return (
    <div className="min-h-screen" style={{ background: '#060d1a', color: '#cce8ff' }}>
      <Header />
      <AlertStrip />
      <div
        className="grid gap-3 p-3 relative z-10"
        style={{ gridTemplateColumns: '280px 1fr 300px' }}
      >
        {/* col 1: spans both rows */}
        <div style={{ gridRow: '1 / 3' }}>
          <EnergySourceStatus />
        </div>
        <div className="panel h-40 flex items-center justify-center" style={{ color: '#4a7a9b' }}>
          LoadForecastChart (coming)
        </div>
        <div className="panel h-40 flex items-center justify-center" style={{ color: '#4a7a9b' }}>
          EarlyWarning (coming)
        </div>
        <div className="panel h-40 flex items-center justify-center" style={{ color: '#4a7a9b' }}>
          DispatchGantt (coming)
        </div>
        <div className="panel h-40 flex items-center justify-center" style={{ color: '#4a7a9b' }}>
          AdvisoryAgent (coming)
        </div>
      </div>
    </div>
  )
}
