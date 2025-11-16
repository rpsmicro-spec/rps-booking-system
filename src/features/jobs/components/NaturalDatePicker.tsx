'use client'

import * as React from 'react'
import { parseDate } from 'chrono-node'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

function formatDate(date: Date | undefined): string {
  if (!date) {
    return ''
  }
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

interface NaturalDatePickerProps {
  id?: string
  value?: string // ISO date string (YYYY-MM-DD)
  onChange: (date: string | undefined) => void
  disabled?: boolean
  label?: string
  placeholder?: string
  'aria-invalid'?: boolean
  required?: boolean
}

export function NaturalDatePicker({
  id,
  value,
  onChange,
  disabled,
  label,
  placeholder = 'Tomorrow or next week',
  'aria-invalid': ariaInvalid,
  required = false,
}: NaturalDatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(
    value ? formatDate(new Date(value)) : ''
  )
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  )
  const [month, setMonth] = React.useState<Date | undefined>(date)

  // Update state when value prop changes
  React.useEffect(() => {
    if (value) {
      const newDate = new Date(value)
      setDate(newDate)
      setInputValue(formatDate(newDate))
      setMonth(newDate)
    } else {
      setDate(undefined)
      setInputValue('')
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    const parsedDate = parseDate(newValue)
    if (parsedDate) {
      setDate(parsedDate)
      setMonth(parsedDate)
      onChange(parsedDate.toISOString().split('T')[0])
    } else if (newValue === '') {
      setDate(undefined)
      onChange(undefined)
    }
  }

  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate)
      const formatted = formatDate(selectedDate)
      setInputValue(formatted)
      onChange(selectedDate.toISOString().split('T')[0])
      setOpen(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <Label htmlFor={id} className="px-1">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className="relative flex gap-2">
        <Input
          id={id}
          value={inputValue}
          placeholder={placeholder}
          className={`bg-background pr-10 ${ariaInvalid ? 'border-destructive' : ''}`}
          onChange={handleInputChange}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setOpen(true)
            }
          }}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
              disabled={disabled}
            >
              <CalendarIcon className="size-3.5" />
              <span className="sr-only">Select date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="end">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              onSelect={handleCalendarSelect}
              disabled={disabled}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="text-muted-foreground px-1 text-xs h-5">
        {date ? (
          <>
            Selected date: <span className="font-medium">{formatDate(date)}</span>
          </>
        ) : (
          <span className="invisible">Selected date: </span>
        )}
      </div>
    </div>
  )
}

