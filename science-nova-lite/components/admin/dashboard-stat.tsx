"use client"

import { TrendingUp } from "lucide-react"

interface DashboardStatProps {
  label: string
  value: number
  delta: number
  suffix?: string
  icon?: React.ComponentType<{ className?: string }>
  description?: string
  isLoading?: boolean
}

export function DashboardStat({ 
  label, 
  value, 
  delta, 
  suffix, 
  icon: Icon, 
  description, 
  isLoading 
}: DashboardStatProps) {
  if (isLoading) {
    return (
      <div className="group relative rounded-2xl border bg-white/80 p-6 backdrop-blur shadow-lg">
        <div className="animate-pulse">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="group relative rounded-2xl border bg-white/80 p-6 backdrop-blur shadow-lg transition-all hover:bg-white/90 hover:shadow-xl">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
            {Icon && <Icon className="h-4 w-4 text-indigo-500" />}
            {label}
          </div>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-bold text-gray-900">
              {value.toLocaleString()}
              {suffix && <span className="text-xl font-semibold text-gray-600">{suffix}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <span className={`flex items-center text-sm font-medium ${delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              <TrendingUp className={`h-3 w-3 mr-1 ${delta < 0 ? 'rotate-180' : ''}`} />
              {delta >= 0 ? "+" : ""}{delta}%
            </span>
            <span className="text-xs text-gray-500">vs last week</span>
          </div>
        </div>
      </div>
      {description && (
        <div className="mt-3 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
          {description}
        </div>
      )}
    </div>
  )
}
