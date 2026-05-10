import { ChevronDown } from 'lucide-react'
import Header from '../components/Header'
import SingleLineDiagram from '../components/SingleLineDiagram'
import PowerSourcesCard from '../components/PowerSourcesCard'
import MainForecastChart from '../components/MainForecastChart'
import DispatchPowerChart from '../components/DispatchPowerChart'
import BessSocChart from '../components/BessSocChart'
import RecommendedDispatchSchedule from '../components/RecommendedDispatchSchedule'
import EarlyWarningPanel from '../components/EarlyWarningPanel'
import CostAnalysisCard from '../components/CostAnalysisCard'
import BottomStatusBar from '../components/BottomStatusBar'
import AskAgentCard from '../components/AskAgentCard'

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      <Header />

      {/* 3-column body */}
      <main className="flex-1 grid gap-2 p-2 overflow-hidden min-h-0"
        style={{ gridTemplateColumns: '24% 1fr 20%' }}>

        {/* ── Left column ── */}
        <div className="flex flex-col gap-2 overflow-hidden min-h-0">
          <SingleLineDiagram />
          <PowerSourcesCard />
        </div>

        {/* ── Center column ── */}
        <div className="flex flex-col gap-2 overflow-y-auto min-h-0">

          {/* Chart card: header + 3 stacked charts */}
          <div className="bg-white rounded border border-gray-200 shadow-sm flex flex-col min-h-0 flex-1">
            {/* Chart card header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 shrink-0">
              <p className="text-[11px] font-semibold text-gray-800 truncate">
                Koh Tao — Smart Dispatch
              </p>
              <div className="flex items-center gap-1 border border-gray-300 rounded px-2 py-0.5 text-[10px] text-gray-700 bg-gray-50 cursor-pointer hover:bg-gray-100 shrink-0 ml-2">
                Day View <ChevronDown size={10} className="ml-0.5 text-gray-600" />
              </div>
            </div>

            {/* Load forecast chart — tallest */}
            <div className="flex flex-col flex-[3] min-h-0 border-b border-gray-50">
              <p className="text-[9px] text-gray-600 font-semibold px-3 pt-1 shrink-0">
                Island Load Forecast (MW)
              </p>
              <MainForecastChart />
            </div>

            {/* Dispatch bar chart */}
            <div className="flex flex-col flex-[2] min-h-0 border-b border-gray-50">
              <p className="text-[9px] text-gray-600 font-semibold px-3 pt-1 shrink-0">
                Dispatch Power (MW)
              </p>
              <DispatchPowerChart />
            </div>

            {/* BESS SoC chart */}
            <div className="flex flex-col flex-[1.5] min-h-0">
              <p className="text-[9px] text-gray-600 font-semibold px-3 pt-1 shrink-0">
                BESS SoC (%)
              </p>
              <BessSocChart />
            </div>
          </div>

          {/* Schedule table */}
          <RecommendedDispatchSchedule />
        </div>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-2 overflow-y-auto min-h-0">
          <EarlyWarningPanel />
          <CostAnalysisCard />
          <AskAgentCard />
        </div>
      </main>

      <BottomStatusBar />
    </div>
  )
}
