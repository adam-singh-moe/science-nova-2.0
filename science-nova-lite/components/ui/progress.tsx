import * as React from "react"
import { cn } from "@/lib/utils"

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(({ className, value = 0, ...props }, ref) => (
  <div ref={ref} className={cn("relative h-2 w-full overflow-hidden rounded-full bg-secondary", className)} {...props}>
    <div className="h-full w-full flex-1 bg-primary/30 transition-all"></div>
    <div className="absolute left-0 top-0 h-full rounded-full bg-primary progress-glow" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
))
Progress.displayName = "Progress"

export { Progress }
