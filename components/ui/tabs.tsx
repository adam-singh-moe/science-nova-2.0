"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { uiSounds } from "./ui-sounds"

import { cn } from "@/lib/utils"

// Enhanced Tabs with sound effects
const Tabs = ({ onValueChange, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) => {
  const handleValueChange = (value: string) => {
    // Play click sound when tab changes
    uiSounds.playClick()
    
    // Call the original onValueChange handler if provided
    if (onValueChange) {
      onValueChange(value)
    }
  }

  return (
    <TabsPrimitive.Root
      onValueChange={handleValueChange}
      {...props}
    />
  )
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, onMouseEnter, ...props }, ref) => {
  const handleMouseEnter = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Play hover sound when hovering over tab triggers
    uiSounds.playHover()
    
    // Call the original onMouseEnter handler if provided
    if (onMouseEnter) {
      onMouseEnter(event)
    }
  }

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        className
      )}
      onMouseEnter={handleMouseEnter}
      {...props}
    />
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
