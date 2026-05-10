import { ChevronDown } from 'lucide-react'

interface Props {
  isOptimized: boolean
  onApply: () => void
}

export default function BottomStatusBar({ isOptimized, onApply }: Props) {
  return (
    <footer className="h-[40px] flex items-center gap-4 px-4 bg-white border-t border-gray-200 shadow-sm shrink-0 z-10">
      {/* Left: system status */}
      <span className="flex items-center gap-1 text-[13px] text-gray-600">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <span className="font-medium">System Status:</span>
        <span className="text-green-600 font-semibold">Normal</span>
      </span>
      <span className="text-gray-400">|</span>
      <span className="flex items-center gap-1 text-[13px] text-gray-600">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <span className="font-medium">Island Mode:</span>
        <span className="text-green-600 font-semibold">On</span>
      </span>

      {/* Divider */}
      <span className="text-gray-400">|</span>

      {/* Center metrics */}
      <span className="text-[13px] text-gray-600">
        Grid: <span className="font-semibold text-gray-800">Importing</span>
      </span>
      <span className="text-gray-400">|</span>
      <span className="text-[13px] text-gray-600">
        Renewables: <span className="font-semibold text-indigo-700">1.48 MW (18%)</span>
      </span>
      <span className="text-gray-400">|</span>
      <span className="text-[13px] text-gray-600">
        BESS SoC: <span className="font-semibold text-orange-600">65%</span>
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: engineer controls */}
      <span className="text-[13px] text-gray-700">Engineer Decision</span>
      <div className="flex items-center gap-1 border border-gray-300 rounded px-2 py-0.5 text-[13px] text-gray-800 bg-gray-50 cursor-pointer hover:bg-gray-100">
        Auto Hourly (MPC Optimizer)
        <ChevronDown size={12} className="text-gray-600" />
      </div>
      <button
        onClick={isOptimized ? undefined : onApply}
        className={
          isOptimized
            ? 'bg-green-600 text-white text-[13px] font-semibold px-3 py-0.5 rounded cursor-default'
            : 'bg-pea-700 hover:bg-pea-800 text-white text-[13px] font-semibold px-3 py-0.5 rounded transition-colors'
        }
      >
        {isOptimized ? 'Applied ✓' : 'Apply'}
      </button>
    </footer>
  )
}
