"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
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

export interface Customer {
  customer_name: string
  email: string | null
  contact_number: string | null
  address_street: string | null
  address_area: string | null
  address_city: string | null
  address_state: string | null
  address_pincode: string | null
  job_count?: number
}

interface CustomerComboboxProps {
  value?: string
  onChange: (value: string, customer?: Customer) => void
  disabled?: boolean
  placeholder?: string
  id?: string
  "aria-invalid"?: boolean
}

export function CustomerCombobox({
  value,
  onChange,
  disabled = false,
  placeholder = "Select or type customer name...",
  id,
  "aria-invalid": ariaInvalid,
}: CustomerComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [loading, setLoading] = React.useState(false)

  // Fetch customers when search value changes
  React.useEffect(() => {
    const fetchCustomers = async () => {
      if (!searchValue.trim() && !open) return
      
      setLoading(true)
      try {
        const searchParam = searchValue.trim() || ""
        const response = await fetch(`/api/customers?search=${encodeURIComponent(searchParam)}`)
        if (response.ok) {
          const data = await response.json()
          setCustomers(data.customers || [])
        }
      } catch (error) {
        console.error("Failed to fetch customers:", error)
        setCustomers([])
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(fetchCustomers, 300) // Debounce
    return () => clearTimeout(timeoutId)
  }, [searchValue, open])

  const handleSelect = (customerName: string) => {
    const customer = customers.find(
      (c) => c.customer_name.toLowerCase() === customerName.toLowerCase()
    )
    onChange(customerName, customer)
    setOpen(false)
    setSearchValue("")
  }

  const handleCustomValue = () => {
    if (searchValue.trim()) {
      onChange(searchValue.trim(), undefined)
      setOpen(false)
      setSearchValue("")
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
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
            ariaInvalid && "border-destructive"
          )}
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search customer..." 
            className="h-9"
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {searchValue.trim() ? (
                    <CommandItem
                      onSelect={handleCustomValue}
                      className="cursor-pointer"
                    >
                      Use &quot;{searchValue.trim()}&quot; (new customer)
                    </CommandItem>
                  ) : (
                    "No customer found. Start typing to search..."
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {customers.map((customer) => (
                    <CommandItem
                      key={`${customer.customer_name}_${customer.email || ''}_${customer.contact_number || ''}`}
                      value={customer.customer_name}
                      onSelect={handleSelect}
                    >
                      <div className="flex flex-col">
                        <span>{customer.customer_name}</span>
                        {(customer.email || customer.contact_number) && (
                          <span className="text-xs text-muted-foreground">
                            {customer.email && customer.contact_number
                              ? `${customer.email} • ${customer.contact_number}`
                              : customer.email || customer.contact_number}
                            {customer.job_count ? ` • ${customer.job_count} job${customer.job_count > 1 ? 's' : ''}` : ''}
                          </span>
                        )}
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          value?.toLowerCase() === customer.customer_name.toLowerCase()
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

