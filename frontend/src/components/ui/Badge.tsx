import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        urgent: "bg-red-500/10 text-red-500 border-red-500/20 font-medium",
        high: "bg-orange-500/10 text-orange-500 border-orange-500/20 font-medium",
        medium: "bg-blue-500/10 text-blue-500 border-blue-500/20 font-medium",
        low: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20 font-medium",
        pending: "bg-zinc-800 text-zinc-400 border-zinc-700 font-medium",
        in_progress: "bg-blue-900/20 text-blue-400 border-blue-800/50 font-medium",
        in_review: "bg-purple-900/20 text-purple-400 border-purple-800/50 font-medium",
        completed: "bg-green-900/20 text-green-400 border-green-800/50 font-medium",
        flagged: "bg-red-900/20 text-red-500 border-red-800/50 font-medium",
        reassigned: "bg-orange-900/20 text-orange-400 border-orange-800/50 font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
