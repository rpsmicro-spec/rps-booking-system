/**
 * Utility functions for generating job numbers based on settings
 */

export interface JobNumberSettings {
  prefix: string
  number_base: 'sequence' | 'year'
  next_number: number
  year?: number
}

/**
 * Generate a job number based on settings
 */
export function generateJobNumber(settings: JobNumberSettings): string {
  const { prefix, number_base, next_number, year } = settings
  const currentYear = new Date().getFullYear()

  let numberPart: string

  if (number_base === 'year') {
    // Year-based: 2024-001, 2024-002, etc.
    // If year changed, reset to 1 (handled in API)
    const yearToUse = year || currentYear
    numberPart = `${yearToUse}-${String(next_number).padStart(3, '0')}`
  } else {
    // Sequence-based: 001, 002, 003, etc.
    numberPart = String(next_number).padStart(3, '0')
  }

  // Combine prefix and number
  if (prefix && prefix.trim()) {
    return `${prefix.trim()}-${numberPart}`
  }

  return numberPart
}

/**
 * Increment the next number and handle year changes
 */
export function getNextSettings(
  currentSettings: JobNumberSettings
): Partial<JobNumberSettings> {
  const currentYear = new Date().getFullYear()
  const { number_base, next_number, year } = currentSettings

  if (number_base === 'year') {
    // If year changed, reset to 1
    if (year !== currentYear) {
      return {
        next_number: 1,
        year: currentYear,
      }
    }
    // Otherwise, just increment
    return {
      next_number: next_number + 1,
    }
  } else {
    // Sequence-based: just increment
    return {
      next_number: next_number + 1,
    }
  }
}

