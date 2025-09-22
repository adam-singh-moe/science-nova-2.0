import * as React from "react"
import { cn } from "@/lib/utils"

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  variant?: 'default' | 'success' | 'warm' | 'gradient'
  showGlow?: boolean
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, variant = 'default', showGlow = false, ...props }, ref) => {
    const getProgressColors = () => {
      if (value >= 100) {
        return {
          bg: "bg-success-100",
          fill: "bg-gradient-to-r from-success-500 to-success-600",
          glow: showGlow ? "shadow-glow-green" : ""
        }
      }
      
      switch (variant) {
        case 'success':
          return {
            bg: "bg-success-100",
            fill: "bg-gradient-to-r from-success-500 to-success-600",
            glow: showGlow ? "shadow-glow-green" : ""
          }
        case 'warm':
          return {
            bg: "bg-orange-100",
            fill: "bg-gradient-to-r from-orange-500 to-orange-600",
            glow: showGlow ? "shadow-glow-orange" : ""
          }
        case 'gradient':
          return {
            bg: "bg-gradient-to-r from-orange-100 to-blue-100",
            fill: "bg-gradient-to-r from-orange-500 via-yellow-500 to-blue-500",
            glow: showGlow ? "shadow-glow animate-subtle-glow" : ""
          }
        default:
          return {
            bg: "bg-gray-200",
            fill: "bg-gradient-to-r from-blue-500 to-blue-600",
            glow: showGlow ? "shadow-glow" : ""
          }
      }
    }

    const colors = getProgressColors()
    const clampedValue = Math.min(100, Math.max(0, value))

    return (
      <div 
        ref={ref} 
        className={cn(
          `relative h-4 w-full overflow-hidden rounded-full ${colors.bg} ${colors.glow}`,
          className
        )} 
        {...props}
      >
        <div className="h-full w-full flex-1 bg-gray-100/50 transition-all"></div>
        <div 
          className={cn(
            `absolute left-0 top-0 h-full rounded-full ${colors.fill} transition-all duration-500 ease-out`,
            clampedValue >= 100 && "animate-soft-pulse"
          )}
          style={{ width: `${clampedValue}%` }} 
        />
        {clampedValue >= 100 && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_ease-in-out_infinite]" />
        )}
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
