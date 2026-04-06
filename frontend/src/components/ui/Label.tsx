import * as React from "react"
import { cn } from "../../lib/utils"

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-xs font-medium text-zinc-500 mb-2 block",
      className
    )}
    {...props}
  />
))
Label.displayName = "Label"

export { Label }
