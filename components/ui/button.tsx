import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-500 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-fuchsia-500 via-pink-500 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/50 hover:from-fuchsia-400 hover:via-pink-400 hover:to-fuchsia-500 hover:shadow-xl hover:shadow-fuchsia-500/70 focus-visible:ring-fuchsia-500 glow-pink animate-pulse-glow",
        destructive: "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/30 hover:from-red-700 hover:to-rose-700 hover:shadow-xl hover:shadow-red-500/40 focus-visible:ring-red-500",
        outline: "border-2 border-fuchsia-500/50 bg-black/40 text-fuchsia-400 shadow-sm hover:bg-fuchsia-500/20 hover:border-fuchsia-500 hover:text-fuchsia-300 hover:shadow-md hover:glow-pink focus-visible:ring-fuchsia-500 backdrop-blur-sm",
        secondary: "bg-gradient-to-r from-purple-900/50 to-fuchsia-900/50 text-cyan-300 shadow-sm hover:from-purple-800/60 hover:to-fuchsia-800/60 hover:shadow-md hover:glow-cyan focus-visible:ring-cyan-500 border border-cyan-500/30",
        ghost: "text-fuchsia-400 hover:bg-fuchsia-500/20 hover:text-fuchsia-300 focus-visible:ring-fuchsia-500",
        link: "text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline focus-visible:ring-cyan-500 neon-cyan",
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
