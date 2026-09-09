import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'penal' | 'civil' | 'laboral' | 'familia' | 'administrativo' | 'success' | 'warning' | 'error'
}

const variantClasses: Record<string, string> = {
  default: 'bg-primary-100 text-primary-700 border-primary-200',
  secondary: 'bg-secondary-100 text-secondary-700 border-secondary-200',
  outline: 'bg-transparent border-border text-gray-700',
  penal: 'bg-red-100 text-red-800 border-red-200',
  civil: 'bg-blue-100 text-blue-800 border-blue-200',
  laboral: 'bg-green-100 text-green-800 border-green-200',
  familia: 'bg-purple-100 text-purple-800 border-purple-200',
  administrativo: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  error: 'bg-red-100 text-red-800 border-red-200',
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        'transition-colors',
        variantClasses[variant] || variantClasses.default,
        className
      )}
      {...props}
    />
  )
}
