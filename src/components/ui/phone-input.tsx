'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface PhoneInputProps extends Omit<React.ComponentProps<typeof Input>, 'onChange' | 'value'> {
  value?: string
  onChange?: (value: string) => void
  defaultCountryCode?: string
}

/**
 * Phone input component with Indian formatting (+91 XXXXX XXXXX)
 */
export function PhoneInput({
  className,
  value = '',
  onChange,
  defaultCountryCode = '+91',
  ...props
}: PhoneInputProps) {
  const formatPhoneNumber = React.useCallback((input: string, countryCode: string): string => {
    // Remove all non-digit characters except +
    let digits = input.replace(/[^\d+]/g, '')

    // Handle different input formats
    if (digits.startsWith('+91')) {
      // Already has +91
      digits = digits
    } else if (digits.startsWith('91') && !digits.startsWith('+')) {
      // Has 91 but no +
      digits = '+' + digits
    } else if (digits.startsWith('0')) {
      // Remove leading 0 and add country code
      digits = countryCode + digits.slice(1)
    } else if (digits.length > 0 && !digits.startsWith('+')) {
      // Just digits, add country code
      digits = countryCode + digits
    } else if (digits.length === 0) {
      // Empty, return just country code with space
      return countryCode + ' '
    }

    // Ensure it starts with +91
    if (!digits.startsWith('+91')) {
      // Remove any existing + and add +91
      digits = countryCode + digits.replace(/^\+/, '')
    }

    // Get the number part (after +91)
    const numberPart = digits.replace(/^\+91/, '').replace(/\D/g, '')

    // Limit to 10 digits (Indian phone numbers)
    const limitedNumber = numberPart.slice(0, 10)

    // Format: +91 XXXXX XXXXX (5-5 split)
    if (limitedNumber.length === 0) {
      return countryCode + ' '
    } else if (limitedNumber.length <= 5) {
      return countryCode + ' ' + limitedNumber
    } else {
      return countryCode + ' ' + limitedNumber.slice(0, 5) + ' ' + limitedNumber.slice(5)
    }
  }, [])

  const [displayValue, setDisplayValue] = React.useState(() => {
    if (value) {
      return formatPhoneNumber(value, defaultCountryCode)
    }
    return defaultCountryCode + ' '
  })

  // Initialize display value
  React.useEffect(() => {
    if (value) {
      setDisplayValue(formatPhoneNumber(value, defaultCountryCode))
    } else {
      setDisplayValue(defaultCountryCode + ' ')
    }
  }, [value, defaultCountryCode, formatPhoneNumber])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    const formatted = formatPhoneNumber(input, defaultCountryCode)
    setDisplayValue(formatted)

    // Extract the full number for storage: +91XXXXXXXXXX (no spaces)
    const fullNumber = formatted.replace(/\s/g, '')
    onChange?.(fullNumber)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow backspace, delete, arrow keys, tab
    if (
      ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key) ||
      (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()))
    ) {
      return
    }

    // Prevent non-digit input (except + which is handled)
    if (!/[0-9+]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
    }
  }

  return (
    <Input
      {...props}
      type="tel"
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className={cn(className)}
      placeholder={defaultCountryCode + ' XXXXX XXXXX'}
    />
  )
}
