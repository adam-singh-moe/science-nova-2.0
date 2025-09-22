"use client"

import React from 'react'
import { cn } from '@/lib/utils'

// Clean Data Visualization Components with smooth animation reveals
interface ChartProps {
  className?: string
  animated?: boolean
}

// Animated Progress Ring Chart
interface ProgressRingProps extends ChartProps {
  progress: number
  size?: 'sm' | 'md' | 'lg'
  label?: string
  color?: string
  thickness?: number
}

export const AnimatedProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 'md',
  label,
  color = 'text-blue-500',
  thickness = 8,
  className,
  animated = true
}) => {
  const sizes = {
    sm: { width: 80, center: 40, radius: 30 },
    md: { width: 120, center: 60, radius: 45 },
    lg: { width: 160, center: 80, radius: 65 }
  }
  
  const { width, center, radius } = sizes[size]
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={width} height={width} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={thickness}
          fill="none"
          className="text-gray-200"
        />
        
        {/* Progress ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? strokeDashoffset : circumference}
          className={cn(
            color,
            animated && 'transition-all duration-1000 ease-out animate-progress-ring'
          )}
          style={{ 
            strokeDashoffset: animated ? strokeDashoffset : circumference,
            transitionDelay: '0.5s'
          }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-700">
          {Math.round(progress)}%
        </span>
        {label && (
          <span className="text-sm text-gray-500 font-medium">{label}</span>
        )}
      </div>
    </div>
  )
}

// Animated Bar Chart
interface BarChartProps extends ChartProps {
  data: Array<{ label: string; value: number; color?: string }>
  maxValue?: number
  height?: number
}

export const AnimatedBarChart: React.FC<BarChartProps> = ({
  data,
  maxValue,
  height = 200,
  className,
  animated = true
}) => {
  const max = maxValue || Math.max(...data.map(d => d.value))
  
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-end justify-between gap-2" style={{ height }}>
        {data.map((item, index) => {
          const barHeight = (item.value / max) * height
          const color = item.color || 'bg-blue-500'
          
          return (
            <div key={item.label} className="flex-1 flex flex-col items-center">
              <div className="w-full flex justify-center mb-2">
                <div
                  className={cn(
                    'w-full max-w-12 rounded-t-lg transition-all duration-1000 ease-out',
                    color,
                    animated && 'animate-progress-fill'
                  )}
                  style={{ 
                    height: animated ? barHeight : 0,
                    transitionDelay: `${index * 100}ms`
                  }}
                />
              </div>
              <span className="text-xs text-gray-600 text-center font-medium">
                {item.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Animated Line Chart with SVG
interface LineChartProps extends ChartProps {
  data: Array<{ x: number; y: number }>
  width?: number
  height?: number
  color?: string
}

export const AnimatedLineChart: React.FC<LineChartProps> = ({
  data,
  width = 300,
  height = 200,
  color = 'stroke-blue-500',
  className,
  animated = true
}) => {
  if (data.length < 2) return null
  
  const margin = 20
  const chartWidth = width - margin * 2
  const chartHeight = height - margin * 2
  
  const xMax = Math.max(...data.map(d => d.x))
  const xMin = Math.min(...data.map(d => d.x))
  const yMax = Math.max(...data.map(d => d.y))
  const yMin = Math.min(...data.map(d => d.y))
  
  const xScale = (x: number) => ((x - xMin) / (xMax - xMin)) * chartWidth + margin
  const yScale = (y: number) => chartHeight - ((y - yMin) / (yMax - yMin)) * chartHeight + margin
  
  const pathData = data.map((point, index) => {
    const x = xScale(point.x)
    const y = yScale(point.y)
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  return (
    <div className={cn('relative', className)}>
      <svg width={width} height={height}>
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Data line */}
        <path
          d={pathData}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            color,
            animated && 'chart-path animate-chart-reveal'
          )}
        />
        
        {/* Data points */}
        {data.map((point, index) => (
          <circle
            key={index}
            cx={xScale(point.x)}
            cy={yScale(point.y)}
            r="4"
            className={cn(
              'fill-current',
              color.replace('stroke-', 'text-'),
              animated && 'animate-stagger-fade'
            )}
            style={{ animationDelay: `${1000 + index * 100}ms` }}
          />
        ))}
      </svg>
    </div>
  )
}

// Stats Card with Animated Counter
interface StatsCardProps {
  label: string
  value: number
  change?: number
  icon?: React.ReactNode
  color?: string
  className?: string
  animated?: boolean
}

export const AnimatedStatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  change,
  icon,
  color = 'text-blue-500',
  className,
  animated = true
}) => {
  const [displayValue, setDisplayValue] = React.useState(0)
  
  React.useEffect(() => {
    if (!animated) {
      setDisplayValue(value)
      return
    }
    
    const duration = 1000
    const steps = 60
    const increment = value / steps
    let current = 0
    
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(current))
      }
    }, duration / steps)
    
    return () => clearInterval(timer)
  }, [value, animated])
  
  return (
    <div className={cn(
      'bg-white rounded-xl p-6 shadow-lg border border-gray-100',
      'hover:shadow-xl transition-shadow duration-300',
      animated && 'animate-fade-up',
      className
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className={cn('text-3xl font-bold', color)}>
            {displayValue.toLocaleString()}
          </p>
          {change !== undefined && (
            <p className={cn(
              'text-sm font-medium flex items-center gap-1 mt-1',
              change >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              <span>{change >= 0 ? '↗' : '↘'}</span>
              {Math.abs(change)}%
            </p>
          )}
        </div>
        {icon && (
          <div className={cn(
            'p-3 rounded-full bg-gray-50',
            color.replace('text-', 'text-'),
            animated && 'animate-gentle-bounce'
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

export {
  AnimatedProgressRing,
  AnimatedBarChart,
  AnimatedLineChart,
  AnimatedStatsCard
}
