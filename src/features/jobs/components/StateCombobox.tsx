"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { INDIAN_STATES } from "@/lib/data/indian-states"

interface StateComboboxProps {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  id?: string
  "aria-invalid"?: boolean
}

export function StateCombobox({
  value,
  onChange,
  disabled = false,
  placeholder = "Select state...",
  id,
  "aria-invalid": ariaInvalid,
}: StateComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedState = value
    ? INDIAN_STATES.find((state) => state.value.toLowerCase() === value.toLowerCase())
    : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={ariaInvalid}
          disabled={disabled}
          suppressHydrationWarning
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
            ariaInvalid && "border-destructive"
          )}
        >
          {selectedState ? selectedState.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search state..." className="h-9" />
          <CommandList>
            <CommandEmpty>No state found.</CommandEmpty>
            <CommandGroup>
              {INDIAN_STATES.map((state) => (
                <CommandItem
                  key={state.value}
                  value={state.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  {state.label}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value?.toLowerCase() === state.value.toLowerCase()
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

