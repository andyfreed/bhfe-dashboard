/**
 * Shared utility functions for metrics calculations
 */

/**
 * Calculate percentage change between two values
 */
export function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

/**
 * Format percentage with sign
 */
export function formatPercentChange(change: number): string {
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(0)}%`
}

/**
 * Format currency
 */
export function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`
}

