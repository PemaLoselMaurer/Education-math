import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link"
  size?: "default" | "sm" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "default", size = "default", ...props },
    ref
  ) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-full font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          variant === "default" && "bg-blue-500 text-white hover:bg-blue-600",
          variant === "outline" && "border border-blue-500 text-blue-500 bg-white hover:bg-blue-50",
          variant === "ghost" && "bg-transparent hover:bg-blue-100 text-blue-600",
          variant === "link" && "bg-transparent underline text-blue-600 hover:text-blue-800",
          size === "default" && "px-8 py-4 text-lg",
          size === "sm" && "px-4 py-2 text-base",
          size === "lg" && "px-10 py-5 text-xl",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
