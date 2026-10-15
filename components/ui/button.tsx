import * as React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const buttonVariants = {
  default: 'bg-[#1B5E20] text-white hover:bg-[#144A17]',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
  outline: 'border border-[#e7e9f1] bg-transparent hover:bg-[#f7f8fc] dark:border-slate-700 dark:hover:bg-slate-800',
  secondary: 'bg-[#f7f8fc] text-[#20243a] hover:bg-[#e7e9f1] dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
  ghost: 'hover:bg-[#f7f8fc] dark:hover:bg-slate-800',
  link: 'text-[#1B5E20] underline-offset-4 hover:underline',
}

const buttonSizes = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-md px-3',
  lg: 'h-11 rounded-md px-8',
  icon: 'h-10 w-10',
}

export function Button({
  className = '',
  variant = 'default',
  size = 'default',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E20] focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

export function cn(...inputs: (string | undefined | false | null)[]) {
  return inputs.filter(Boolean).join(' ')
}
