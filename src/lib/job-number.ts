/**
 * Utility functions for generating job numbers based on settings
 * Format: {PREFIX}-{number}/{year1-year2}
 * Example: RPS-1/25-26 (April 2025 - March 2026)
 */

export interface JobNumberSettings {
  prefix: string
  number_base: 'sequence' | 'year' // Kept for backward compatibility, but not used
  next_number: number
  year?: number // Financial year start year (e.g., 2025 for April 2025 - March 2026)
}

/**
 * Get financial year start year (April 1 - March 31)
 * Returns the year when the financial year started
 * Example: April 2025 = 2025, March 2026 = 2025
 */
export function getFinancialYearStartYear(date: Date = new Date()): number {
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // getMonth() returns 0-11, so add 1
  
  // Financial year starts April 1
  // If month is April (4) or later, it's the current year's financial year
  // If month is Jan-Mar (1-3), it's the previous year's financial year
  if (month >= 4) {
    return year
  } else {
    return year - 1
  }
}

/**
 * Get financial year string (e.g., '25-26' for April 2025 - March 2026)
 */
export function getFinancialYearString(date: Date = new Date()): string {
  const startYear = getFinancialYearStartYear(date)
  const endYear = startYear + 1
  
  // Return last 2 digits of each year
  const startYearShort = String(startYear % 100).padStart(2, '0')
  const endYearShort = String(endYear % 100).padStart(2, '0')
  
  return `${startYearShort}-${endYearShort}`
}

/**
 * Generate a job number based on settings using financial year format
 * Format: {PREFIX}-{number}/{year1-year2}
 * Example: RPS-1/25-26
 */
export function generateJobNumber(settings: JobNumberSettings): string {
  const { prefix, next_number } = settings
  const financialYear = getFinancialYearString()
  const prefixToUse = prefix && prefix.trim() ? prefix.trim() : 'RPS'
  
  // Format: RPS-1/25-26
  return `${prefixToUse}-${next_number}/${financialYear}`
}

/**
 * Increment the next number and handle financial year changes
 */
export function getNextSettings(
  currentSettings: JobNumberSettings
): Partial<JobNumberSettings> {
  const currentFyStartYear = getFinancialYearStartYear()
  const { next_number, year } = currentSettings

  // If financial year changed (new April 1st), reset to 1
  if (year !== currentFyStartYear) {
    return {
      next_number: 1,
      year: currentFyStartYear,
    }
  }
  
  // Otherwise, just increment
  return {
    next_number: next_number + 1,
  }
}

