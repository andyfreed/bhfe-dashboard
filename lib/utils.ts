import { type ClassValue, clsx } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

/**
 * Check if the app is running in Electron
 */
export function isElectron(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as any).electron
}

/**
 * Get Electron API if available
 */
export function getElectronAPI() {
  if (typeof window === 'undefined') return null
  return (window as any).electron || null
}

