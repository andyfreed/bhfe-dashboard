import { addDays, addWeeks, addMonths, addYears } from 'date-fns'

export type RecurringPattern = 
  | 'daily' 
  | 'weekly' 
  | 'monthly' 
  | 'yearly'
  | 'quarterly'
  | 'bi-annually'
  | 'tri-annually'
  | 'birthday-month'
  | 'odd-years'
  | 'even-years'

export const RECURRING_PATTERNS: { value: RecurringPattern; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'bi-annually', label: 'Bi-annually' },
  { value: 'tri-annually', label: 'Tri-Annually' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'birthday-month', label: 'Birthday Month' },
  { value: 'odd-years', label: 'Odd Years' },
  { value: 'even-years', label: 'Even Years' },
]

/**
 * Get the display label for a recurring pattern
 */
export function getRecurringPatternLabel(pattern: string | null): string {
  if (!pattern) return ''
  const found = RECURRING_PATTERNS.find(p => p.value === pattern)
  return found ? found.label : pattern
}

/**
 * Calculate the next occurrence date for a recurring pattern
 */
export function getNextRecurringDate(currentDate: Date, pattern: RecurringPattern): Date {
  const date = new Date(currentDate)
  
  switch (pattern) {
    case 'daily':
      return addDays(date, 1)
    
    case 'weekly':
      return addWeeks(date, 1)
    
    case 'monthly':
      return addMonths(date, 1)
    
    case 'quarterly':
      // Every 3 months
      return addMonths(date, 3)
    
    case 'bi-annually':
      // Every 6 months (twice a year)
      return addMonths(date, 6)
    
    case 'tri-annually':
      // Every 4 months (three times a year)
      return addMonths(date, 4)
    
    case 'yearly':
      return addYears(date, 1)
    
    case 'birthday-month':
      // Same month and day, next year
      return addYears(date, 1)
    
    case 'odd-years': {
      // Only on odd years (2025, 2027, 2029, etc.)
      const currentYear = date.getFullYear()
      const isOddYear = currentYear % 2 === 1
      // If current year is odd, add 2 years. If even, add 1 year to get to next odd year.
      return addYears(date, isOddYear ? 2 : 1)
    }
    
    case 'even-years': {
      // Only on even years (2026, 2028, 2030, etc.)
      const currentYear = date.getFullYear()
      const isEvenYear = currentYear % 2 === 0
      // If current year is even, add 2 years. If odd, add 1 year to get to next even year.
      return addYears(date, isEvenYear ? 2 : 1)
    }
    
    default:
      return addDays(date, 1)
  }
}

