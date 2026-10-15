import * as React from 'react'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

const badgeVariants = {
  default: 'bg-[#1B5E20] text-white',
  secondary: 'bg-[#f7f8fc] text-[#20243a] dark:bg-slate-800 dark:text-slate-200',
  destructive: 'bg-red-600 text-white',
  outline: 'border border-[#e7e9f1] text-[#20243a] dark:border-slate-700 dark:text-slate-200',
}

export function Badge({ className = '', variant = 'default', children, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function cn(...inputs: (string | undefined | false | null)[]) {
  return inputs.filter(Boolean).join(' ')
}
