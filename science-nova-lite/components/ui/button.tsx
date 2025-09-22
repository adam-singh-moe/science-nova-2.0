import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { uiSounds } from "./ui-sounds"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium ring-offset-background transition-all duration-300 ease-out shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default: "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 hover:scale-[1.02] hover:shadow-elevation-2",
				destructive:
					"bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 hover:scale-[1.02] hover:shadow-elevation-2",
				outline:
					"border-2 border-gray-300 bg-white/80 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-400 hover:shadow-soft-lg hover:scale-[1.01]",
				secondary:
					"bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 hover:from-gray-200 hover:to-gray-300 hover:scale-[1.01] hover:shadow-soft",
				ghost: "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 hover:scale-[1.01]",
				link: "text-blue-600 underline-offset-4 hover:underline hover:text-blue-700",
				success: "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:scale-[1.02] hover:shadow-glow-green",
				physics: "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:scale-[1.02] hover:shadow-glow",
				chemistry: "bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 hover:scale-[1.02] hover:shadow-glow-purple",
				biology: "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:scale-[1.02] hover:shadow-glow-green",
				math: "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:scale-[1.02] hover:shadow-glow-orange",
			},
			size: {
				default: "h-10 px-4 py-2",
				sm: "h-9 px-3 text-xs",
				lg: "h-12 px-8 text-base",
				icon: "h-10 w-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	}
)

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, onClick, ...props }, ref) => {
		const Comp = asChild ? Slot : "button"
    
		const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
			if (variant !== "ghost") {
				uiSounds.playClick()
			}
			if (onClick) {
				onClick(event)
			}
		}
    
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				onClick={handleClick}
				{...props}
			/>
		)
	}
)
Button.displayName = "Button"

export { Button, buttonVariants }
