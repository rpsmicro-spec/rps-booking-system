'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value?: string
  onChange: (date: string | undefined) => void
  disabled?: boolean
  placeholder?: string
  id?: string
  'aria-invalid'?: boolean
}

export function DatePicker({
  value,
  onChange,
  disabled,
  placeholder = 'Pick a date',
  id,
  'aria-invalid': ariaInvalid,
}: DatePickerProps) {
  const date = value ? new Date(value) : undefined

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          data-empty={!date}
          className={cn(
            'w-full justify-start text-left font-normal',
            'data-[empty=true]:text-muted-foreground',
            ariaInvalid && 'border-destructive'
          )}
          disabled={disabled}
          aria-invalid={ariaInvalid}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            onChange(selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined)
          }}
          disabled={disabled}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}

