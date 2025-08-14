"use client"

import { cn } from "@/lib/utils"

interface ScienceLoadingProps {
  message?: string
  type?: "atom" | "orbit" | "dots"
  className?: string
}

export function ScienceLoading({ message = "Loading...", type = "atom", className }: ScienceLoadingProps) {
  return (
    <div className={cn("w-full min-h-[200px] flex flex-col items-center justify-center gap-3", className)}>
      {type === "atom" && (
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-blue-300 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-purple-300 animate-pulse" />
          <div className="absolute inset-4 rounded-full border-2 border-pink-300 animate-[spin_3s_linear_infinite]" />
        </div>
      )}
      {type === "orbit" && (
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border border-blue-300" />
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full animate-[spin_1.2s_linear_infinite] origin-[50%_32px]" />
        </div>
      )}
      {type === "dots" && (
        <div className="flex gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.2s]" />
          <span className="w-3 h-3 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.1s]" />
          <span className="w-3 h-3 rounded-full bg-pink-500 animate-bounce" />
        </div>
      )}
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  )
}
