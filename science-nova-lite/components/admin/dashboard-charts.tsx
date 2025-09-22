"use client"

import { 
  ChartContainer, 
  ChartLegend, 
  ChartLegendContent, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, TrendingDown } from "lucide-react"

type DayPoint = { day: string; views: number; quizzes: number }
type TopicSlice = { name: string; value: number; color: string }

interface EngagementChartProps {
  data: DayPoint[]
  isLoading?: boolean
}

interface TopicChartProps {
  data: TopicSlice[]
  isLoading?: boolean
}

export function EngagementChart({ data, isLoading }: EngagementChartProps) {
  const hasData = data && data.length > 0 && data.some(d => d.views > 0 || d.quizzes > 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-sm text-gray-500">Loading engagement data...</span>
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-center">
        <TrendingUp className="h-12 w-12 text-gray-400 mb-3" />
        <h4 className="text-sm font-medium text-gray-900 mb-1">No engagement data yet</h4>
        <p className="text-sm text-gray-500">Data will appear as students start viewing lessons and taking quizzes.</p>
      </div>
    )
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={data} 
          margin={{ left: 0, right: 0, top: 20, bottom: 20 }}
        >
          <defs>
            <linearGradient id="fillViews" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="fillQuizzes" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="day" 
            tickLine={false} 
            axisLine={false}
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <YAxis 
            tickLine={false} 
            axisLine={false}
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <ChartTooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white/95 border border-gray-200 shadow-lg rounded-lg p-3">
                    <p className="font-medium text-gray-900 mb-2">{label}</p>
                    {payload.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-sm" 
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm text-gray-600">{entry.name}:</span>
                        <span className="text-sm font-medium">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                )
              }
              return null
            }}
          />
          <Area 
            type="monotone" 
            dataKey="views" 
            stroke="#6366f1" 
            fill="url(#fillViews)" 
            strokeWidth={3}
            name="Lesson Views"
            dot={{ fill: "#6366f1", strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7, stroke: "#6366f1", strokeWidth: 2, fill: "#6366f1" }}
          />
          <Area 
            type="monotone" 
            dataKey="quizzes" 
            stroke="#10b981" 
            fill="url(#fillQuizzes)" 
            strokeWidth={3}
            name="Quiz Attempts"
            dot={{ fill: "#10b981", strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7, stroke: "#10b981", strokeWidth: 2, fill: "#10b981" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TopicChart({ data, isLoading }: TopicChartProps) {
  const hasData = data && data.length > 0 && !data.every(d => d.name === 'No Data')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-sm text-gray-500">Loading topic data...</span>
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-center">
        <TrendingDown className="h-12 w-12 text-gray-400 mb-3" />
        <h4 className="text-sm font-medium text-gray-900 mb-1">No topic data available</h4>
        <p className="text-sm text-gray-500">Topic distribution will appear once students start viewing lessons.</p>
      </div>
    )
  }

  return (
    <div className="w-full h-80 flex flex-col items-center">
      <div className="flex-1 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie 
              data={data} 
              dataKey="value" 
              nameKey="name" 
              cx="50%" 
              cy="50%" 
              innerRadius={35} 
              outerRadius={65} 
              paddingAngle={2}
              strokeWidth={2}
              stroke="#ffffff"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              ))}
            </Pie>
            <ChartTooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-white/95 border border-gray-200 shadow-lg rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-sm" 
                          style={{ backgroundColor: data.color }}
                        />
                        <span className="text-sm font-medium text-gray-900">{data.name}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{data.value}% of topics</p>
                    </div>
                  )
                }
                return null
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 justify-center">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="h-3 w-3 rounded-sm" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs font-medium text-gray-700">
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
