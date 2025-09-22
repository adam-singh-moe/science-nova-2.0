import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & {
		variant?: 'default' | 'glass' | 'elevated' | 'success' | 'interactive'
		elevation?: 'low' | 'medium' | 'high' | 'floating' | 'modal'
	}
>(({ className, variant = 'default', elevation = 'medium', ...props }, ref) => {
	const baseStyles = "rounded-3xl text-card-foreground transition-all duration-300 ease-out"
	
	const variants = {
		default: "bg-white/95 border border-gray-200/60 shadow-soft-lg",
		glass: "bg-white/80 backdrop-blur-glass border border-white/20 shadow-soft-lg",
		elevated: `bg-white shadow-elevation-${elevation}`,
		success: "bg-gradient-to-br from-success-100 via-success-50 to-success-100 border border-success-200 shadow-glow-green",
		interactive: "bg-white/95 border border-gray-200/60 shadow-soft hover:shadow-elevation-3 hover:scale-[1.01] cursor-pointer"
	}
	
	return (
		<div
			ref={ref}
			className={cn(
				baseStyles,
				variants[variant],
				className
			)}
			{...props}
		/>
	)
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex flex-col space-y-1.5 p-6", className)}
		{...props}
	/>
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & {
		gradient?: boolean
	}
>(({ className, gradient = false, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			"text-2xl font-semibold leading-none tracking-tight",
			gradient && "bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent",
			className
		)}
		{...props}
	/>
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("text-sm text-muted-foreground", className)}
		{...props}
	/>
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex items-center p-6 pt-0", className)}
		{...props}
	/>
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
