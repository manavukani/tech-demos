import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'

import { cn } from '#/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'text-foreground',
        accent: 'border-sky-500/40 bg-sky-500/15 text-sky-300',
        warn: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
