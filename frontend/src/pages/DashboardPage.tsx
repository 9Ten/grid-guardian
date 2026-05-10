import { useState } from 'react'
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
import {
  dispatchSchedule,
  optimizedDispatchSchedule,
  bessSocData,
  optimizedBessSocData,
} from '../data/mockDashboardData'

export default function DashboardPage() {
  const [isOptimized, setIsOptimized] = useState(false)

  const activeDispatch = isOptimized ? optimizedDispatchSchedule : dispatchSchedule
  const activeBessSoc  = isOptimized ? optimizedBessSocData      : bessSocData

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      <Header />

      {/* 3-column body — never scrolls at this level */}
      <main className="flex-1 grid gap-3 p-3 overflow-hidden min-h-0"
        style={{ gridTemplateColumns: '24% 1fr 22%' }}>

        {/* ── Left column ── */}
        <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
          <SingleLineDiagram />
          <PowerSourcesCard />
        </div>

        {/* ── Center column — proportional flex, no scroll ── */}
        <div className="flex flex-col gap-3 min-h-0 overflow-hidden">

          {/* Chart card: 3 stacked charts — takes 68% of column */}
          <div className="bg-white rounded border border-gray-200 shadow-sm flex flex-col min-h-0 flex-[68]">
            {/* Chart card header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 shrink-0">
              <p className="text-[13px] font-semibold text-gray-800 truncate">
                Koh Tao — Smart Dispatch
              </p>
              <div className="flex items-center gap-1 border border-gray-300 rounded px-2 py-0.5 text-xs text-gray-700 bg-gray-50 cursor-pointer hover:bg-gray-100 shrink-0 ml-2">
                Day View <ChevronDown size={11} className="ml-0.5 text-gray-600" />
              </div>
            </div>

            {/* Load forecast chart — tallest */}
            <div className="flex flex-col flex-[3] min-h-0 border-b border-gray-50">
              <p className="text-[11px] text-gray-600 font-semibold px-3 pt-1.5 shrink-0">
                Island Load Forecast (MW)
              </p>
              <MainForecastChart />
            </div>

            {/* Dispatch bar chart */}
            <div className="flex flex-col flex-[2] min-h-0 border-b border-gray-50">
              <p className="text-[11px] text-gray-600 font-semibold px-3 pt-1.5 shrink-0">
                Dispatch Power (MW)
              </p>
              <DispatchPowerChart data={activeDispatch} />
            </div>

            {/* BESS SoC chart */}
            <div className="flex flex-col flex-[1.5] min-h-0">
              <p className="text-[11px] text-gray-600 font-semibold px-3 pt-1.5 shrink-0">
                BESS SoC (%)
              </p>
              <BessSocChart data={activeBessSoc} />
            </div>
          </div>

          {/* Dispatch schedule — takes remaining 32% */}
          <div className="flex-[32] min-h-0 flex flex-col overflow-hidden">
            <RecommendedDispatchSchedule data={activeDispatch} />
          </div>
        </div>

        {/* ── Right column — proportional flex, no scroll ── */}
        <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
          {/* Alerts grow to fill remaining space */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <EarlyWarningPanel />
          </div>
          <CostAnalysisCard />
          <AskAgentCard />
        </div>
      </main>

      <BottomStatusBar isOptimized={isOptimized} onApply={() => setIsOptimized(true)} />
    </div>
  )
}
