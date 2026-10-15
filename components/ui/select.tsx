'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { cn } from '@/lib/utils'

const Select = SelectPrimitive.Root
const SelectValue = SelectPrimitive.Value

export interface SelectTriggerProps extends React.ComponentProps<typeof SelectPrimitive.Trigger> {}

export function SelectTrigger({ className, ...props }: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-xl border border-[#e7e9f1] bg-white px-3 py-2 text-sm',
        'placeholder:text-[#a0a3b3]',
        'focus:outline-none focus:ring-2 focus:ring-[#1B5E20]/20 focus:border-[#1B5E20]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'dark:border-slate-700 dark:bg-slate-800 dark:text-white',
        className
      )}
      {...props}
    />
  )
}

export interface SelectContentProps {
  className?: string
  children: React.ReactNode
}

export function SelectContent({ className, children }: SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          'relative z-50 max-h-96 min-w-[8rem] overflow-y-auto rounded-xl border border-[#e7e9f1] bg-white text-[#20243a] shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
          className
        )}
      >
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

export interface SelectItemProps
  extends Omit<React.ComponentProps<typeof SelectPrimitive.Item>, 'children'> {
  children?: React.ReactNode
  className?: string
}

export function SelectItem({ className, children, ...props }: SelectItemProps) {
  return (
    <SelectPrimitive.Item
      value={props.value}
      disabled={props.disabled}
      textValue={props.textValue}
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-2 pl-2 pr-8 text-sm outline-none focus:bg-[#f7f8fc] focus:text-[#1B5E20] dark:focus:bg-slate-700 dark:focus:text-slate-200',
        className
      )}
    >
      <span className="absolute right-2 text-[#757575]">
        <SelectPrimitive.ItemIndicator>
          <span className="block h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

export { Select, SelectValue }
export type { SelectProps } from '@radix-ui/react-select'
