import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export const RAMAS_DERECHO = [
  { value: 'penal', label: 'Derecho Penal', color: 'bg-red-100 text-red-800' },
  { value: 'civil', label: 'Derecho Civil', color: 'bg-blue-100 text-blue-800' },
  { value: 'laboral', label: 'Derecho Laboral', color: 'bg-green-100 text-green-800' },
  { value: 'familia', label: 'Derecho de Familia', color: 'bg-purple-100 text-purple-800' },
  { value: 'administrativo', label: 'Derecho Administrativo', color: 'bg-yellow-100 text-yellow-800' },
] as const

export type RamaDerecho = (typeof RAMAS_DERECHO)[number]['value']
