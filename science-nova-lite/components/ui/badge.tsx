import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-2xl border px-3 py-1 text-xs font-semibold transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-blue-300/50 focus:ring-offset-2 shadow-soft",
  {
    variants: {
      variant: {
        default: "border-transparent bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-glow hover:scale-105",
        secondary: "border-gray-200 bg-white/90 text-gray-700 hover:bg-gray-50 hover:border-gray-300",
        destructive: "border-transparent bg-gradient-to-r from-red-500 to-red-600 text-white shadow-glow hover:scale-105",
        outline: "border-gray-300 text-gray-700 bg-white/80 hover:bg-gray-50 hover:border-gray-400",
        success: "border-transparent bg-gradient-to-r from-success-500 to-success-600 text-white shadow-glow-green hover:scale-105",
        // Subject-based variants
        physics: "border-transparent bg-gradient-to-r from-subject-physics-500 to-subject-physics-600 text-white shadow-glow hover:scale-105",
        chemistry: "border-transparent bg-gradient-to-r from-subject-chemistry-500 to-subject-chemistry-600 text-white shadow-glow-purple hover:scale-105",
        biology: "border-transparent bg-gradient-to-r from-subject-biology-500 to-subject-biology-600 text-white shadow-glow-green hover:scale-105",
        math: "border-transparent bg-gradient-to-r from-subject-math-500 to-subject-math-600 text-white shadow-glow-orange hover:scale-105",
        // Grade level variants
        grade: "border-transparent bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-glow-purple hover:scale-105",
        // Interactive states
        interactive: "border-gray-200 bg-white/90 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-300 hover:text-blue-700 hover:scale-105 cursor-pointer",
        soft: "border-transparent bg-gray-100/80 text-gray-600 hover:bg-gray-200/80 hover:scale-105",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
      subject?: 'physics' | 'chemistry' | 'biology' | 'math'
      glow?: boolean
    }

function Badge({ className, variant, subject, glow = false, ...props }: BadgeProps) {
  // Auto-select variant based on subject if provided
  const finalVariant = subject ? subject : variant
  
  return (
    <span 
      className={cn(
        badgeVariants({ variant: finalVariant }), 
        glow && "animate-subtle-glow",
        className
      )} 
      {...props} 
    />
  )
}

export { Badge, badgeVariants }
