import * as React from "react"
import { cn } from "../../lib/utils"

const RadioGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string, variantColor?: string }
>(({ className, label, variantColor, ...props }, ref) => {
  return (
    <label className={cn(
        "flex items-center gap-3 px-4 py-3 border border-[#2e2e2e] cursor-pointer transition-all",
        "has-[:checked]:border-[#F97316]/50 has-[:checked]:bg-[#F97316]/5",
        className
    )}>
      <input
        type="radio"
        className={cn(
          "h-4 w-4 border-[#2e2e2e] text-[#F97316] focus:ring-[#F97316] accent-[#F97316]",
          className
        )}
        ref={ref}
        {...props}
      />
      <span className={cn("text-xs font-black uppercase tracking-widest", variantColor)}>
        {label}
      </span>
    </label>
  )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
