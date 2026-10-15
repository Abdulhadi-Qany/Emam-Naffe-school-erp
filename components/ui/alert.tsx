import * as React from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const alertVariants = cva(
  'relative w-full rounded-lg border border-neutral-200 px-4 py-3 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-neutral-950 dark:border-neutral-800 dark:[&>svg]:text-neutral-50',
  {
    variants: {
      variant: {
        default: 'bg-white text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50',
        destructive:
          'border-red-500/50 text-red-500 dark:border-red-500/50 dark:text-red-500 [&>svg]:text-red-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

export function Alert({ className, variant, ...props }: AlertProps) {
  return <div className={cn(alertVariants({ variant }), className)} role="alert" {...props} />
}

export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
}
