import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-500/40 focus-visible:ring-blue-500",
        destructive: "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/30 hover:from-red-700 hover:to-rose-700 hover:shadow-xl hover:shadow-red-500/40 focus-visible:ring-red-500",
        outline: "border border-white/5 bg-white/5 text-neutral-400 shadow-sm hover:bg-white/10 hover:text-neutral-200 hover:border-white/10 focus-visible:ring-neutral-500",
        secondary: "bg-white/5 border border-white/5 text-neutral-300 shadow-sm hover:bg-white/10 hover:text-neutral-200 focus-visible:ring-neutral-500",
        ghost: "text-neutral-400 hover:bg-white/5 hover:text-neutral-200 focus-visible:ring-neutral-500",
        link: "text-blue-600 underline-offset-4 hover:text-blue-700 hover:underline focus-visible:ring-blue-500",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
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
