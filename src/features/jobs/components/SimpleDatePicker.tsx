"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface SimpleDatePickerProps {
  id?: string
  value?: string // ISO date string (YYYY-MM-DD)
  onChange: (date: string | undefined) => void
  disabled?: boolean
  placeholder?: string
  'aria-invalid'?: boolean
  className?: string
}

export function SimpleDatePicker({
  id,
  value,
  onChange,
  disabled,
  placeholder = "Select date",
  'aria-invalid': ariaInvalid,
  className,
}: SimpleDatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  )

  // Update date when value prop changes
  React.useEffect(() => {
    if (value) {
      setDate(new Date(value))
    } else {
      setDate(undefined)
    }
  }, [value])

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate) {
      // Convert to YYYY-MM-DD format
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const day = String(selectedDate.getDate()).padStart(2, '0')
      onChange(`${year}-${month}-${day}`)
    } else {
      onChange(undefined)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id={id}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          className={cn(
            "w-full justify-between font-normal",
            !date && "text-muted-foreground",
            ariaInvalid && "border-destructive",
            className
          )}
        >
          {date ? date.toLocaleDateString() : placeholder}
          <ChevronDownIcon className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          captionLayout="dropdown"
          onSelect={handleSelect}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  )
}

