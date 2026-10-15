import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea({ className = '', ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-xl border border-[#e7e9f1] bg-white px-3 py-2 text-sm',
        'placeholder:text-[#a0a3b3]',
        'focus:border-[#1B5E20] focus:ring-2 focus:ring-[#1B5E20]/20 focus:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'dark:border-slate-700 dark:bg-slate-800 dark:text-white',
        className
      )}
      {...props}
    />
  )
}
