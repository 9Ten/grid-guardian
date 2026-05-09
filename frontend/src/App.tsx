import Header from './components/Header'
import AlertStrip from './components/AlertStrip'
import EnergySourceStatus from './components/EnergySourceStatus'
import LoadForecastChart from './components/LoadForecastChart'
import EarlyWarning from './components/EarlyWarning'
import DispatchGantt from './components/DispatchGantt'
import AdvisoryAgent from './components/AdvisoryAgent'

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
        <LoadForecastChart />
        <EarlyWarning />
        <DispatchGantt />
        <AdvisoryAgent />
      </div>
    </div>
  )
}
