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
import { getCitiesByState } from "@/lib/data/indian-cities"

interface CityComboboxProps {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  id?: string
  "aria-invalid"?: boolean
  state?: string // Optional: filter cities by state
  allowCustom?: boolean // Allow typing custom city names
}

export function CityCombobox({
  value,
  onChange,
  disabled = false,
  placeholder = "Select city...",
  id,
  "aria-invalid": ariaInvalid,
  state,
  allowCustom = true,
}: CityComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const cities = React.useMemo(() => getCitiesByState(state), [state])
  
  const selectedCity = value
    ? cities.find((city) => city.value.toLowerCase() === value.toLowerCase()) ||
      (allowCustom && value ? { label: value, value: value } : null)
    : null

  // Check if current value is a custom value (not in the list)
  const isCustomValue = value && !cities.some(city => city.value.toLowerCase() === value.toLowerCase())

  const handleSelect = (selectedValue: string) => {
    if (selectedValue === value) {
      onChange("")
    } else {
      onChange(selectedValue)
    }
    setOpen(false)
    setSearchValue("")
  }

  // Handle custom value creation when user types something not in the list
  const handleCustomValue = () => {
    if (allowCustom && searchValue.trim() && !cities.some(city => city.value.toLowerCase() === searchValue.trim().toLowerCase())) {
      handleSelect(searchValue.trim())
    }
  }

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
          {selectedCity ? selectedCity.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={true}>
          <CommandInput 
            placeholder="Search city or type custom..." 
            className="h-9"
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>
              {allowCustom && searchValue.trim() && !cities.some(city => city.value.toLowerCase() === searchValue.trim().toLowerCase()) ? (
                <CommandItem
                  onSelect={handleCustomValue}
                  className="cursor-pointer"
                >
                  Use &quot;{searchValue.trim()}&quot;
                </CommandItem>
              ) : (
                "No city found."
              )}
            </CommandEmpty>
            <CommandGroup>
              {cities.map((city) => (
                <CommandItem
                  key={city.value}
                  value={city.value}
                  onSelect={handleSelect}
                >
                  {city.label}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value?.toLowerCase() === city.value.toLowerCase()
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
              {allowCustom && isCustomValue && value && (
                <CommandItem
                  value={value}
                  onSelect={handleSelect}
                >
                  {value} (custom)
                  <Check className="ml-auto h-4 w-4 opacity-100" />
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

