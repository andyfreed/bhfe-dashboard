import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-yellow-500 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-black shadow-lg shadow-yellow-500/30 hover:from-yellow-400 hover:via-amber-400 hover:to-yellow-500 hover:shadow-xl hover:shadow-yellow-500/50 focus-visible:ring-yellow-500 glow-yellow",
        destructive: "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/30 hover:from-red-700 hover:to-rose-700 hover:shadow-xl hover:shadow-red-500/40 focus-visible:ring-red-500",
        outline: "border-2 border-yellow-500/40 bg-black/30 text-yellow-400 shadow-sm hover:bg-yellow-500/10 hover:border-yellow-500 hover:text-yellow-300 hover:shadow-md focus-visible:ring-yellow-500 backdrop-blur-sm",
        secondary: "bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-sm hover:from-gray-700 hover:to-gray-800 hover:shadow-md focus-visible:ring-gray-500 border border-gray-700",
        ghost: "text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300 focus-visible:ring-yellow-500",
        link: "text-yellow-400 underline-offset-4 hover:text-yellow-300 hover:underline focus-visible:ring-yellow-500",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-14 rounded-xl px-8 text-base",
        icon: "h-11 w-11",
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
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
