"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface Customer {
  customer_name: string;
  email: string | null;
  contact_number: string | null;
  address_street: string | null;
  address_area: string | null;
  address_city: string | null;
  address_state: string | null;
  address_pincode: string | null;
  contact_person_name: string | null;
  job_count?: number;
}

interface CustomerComboboxProps {
  value?: string;
  onChange: (value: string, customer?: Customer) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  "aria-invalid"?: boolean;
}

export function CustomerCombobox({
  value,
  onChange,
  disabled = false,
  placeholder = "Select or type customer name...",
  id,
  "aria-invalid": ariaInvalid,
}: CustomerComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  // Track the selected customer's unique identifier to show correct checkmark
  const [selectedCustomerUniqueId, setSelectedCustomerUniqueId] =
    React.useState<string | null>(null);
  // Cache of the unfiltered list so clearing a search (or reopening the
  // popover) restores the full list instead of the last filtered results.
  const fullListRef = React.useRef<Customer[]>([]);

  // Preload customers on mount for better UX
  React.useEffect(() => {
    const preloadCustomers = async () => {
      try {
        const response = await fetch('/api/customers?search=');
        if (response.ok) {
          const data = await response.json();
          const list = data.customers || [];
          fullListRef.current = list;
          setCustomers(list);
        }
      } catch (error) {
        console.error('Failed to preload customers:', error);
      } finally {
        setIsInitialLoad(false);
      }
    };

    preloadCustomers();
  }, []);

  // Fetch customers when search value changes or when opening the combobox
  React.useEffect(() => {
    // Only fetch when the popover is open
    if (!open) return;

    const search = searchValue.trim();

    // No search: restore the cached full list rather than refetching
    if (!search && fullListRef.current.length > 0) {
      setCustomers(fullListRef.current);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/customers?search=${encodeURIComponent(search)}`,
          { signal: controller.signal }
        );
        if (response.ok) {
          const data = await response.json();
          const list = data.customers || [];
          if (!search) {
            fullListRef.current = list;
          }
          setCustomers(list);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch customers:", error);
        setCustomers([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(fetchCustomers, 300); // Debounce
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchValue, open]);

  const handleSelect = (selectedValue: string) => {
    // The value is a unique identifier: "customer_name|email|contact_number"
    // Extract the customer name (first part before |)
    const customerName = selectedValue.split("|")[0];

    // Find the customer by matching the unique value
    const customer = customers.find((c) => {
      const uniqueValue = `${c.customer_name}|${c.email || ""}|${c.contact_number || ""}`;
      return uniqueValue === selectedValue;
    });

    // Store the unique identifier for checkmark display
    setSelectedCustomerUniqueId(selectedValue);

    onChange(customerName, customer);
    setOpen(false);
  };

  const handleCreateNew = () => {
    if (searchValue.trim()) {
      onChange(searchValue.trim(), undefined);
      setOpen(false);
      setSearchValue("");
    }
  };

  // When popover closes, reset search but keep customers cached
  React.useEffect(() => {
    if (!open) {
      setSearchValue("");
      // Don't clear customers - keep them cached for better UX
    }
  }, [open]);

  // Update selected customer unique ID when value changes externally
  React.useEffect(() => {
    if (value && customers.length > 0) {
      // Find the customer that matches the current value
      const matchingCustomer = customers.find(
        (c) => c.customer_name.toLowerCase() === value.toLowerCase()
      );
      if (matchingCustomer) {
        const uniqueId = `${matchingCustomer.customer_name}|${matchingCustomer.email || ""}|${matchingCustomer.contact_number || ""}`;
        setSelectedCustomerUniqueId(uniqueId);
      }
    } else if (!value) {
      setSelectedCustomerUniqueId(null);
    }
  }, [value, customers]);

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
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search customer..."
            className="h-9"
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            {loading && !isInitialLoad ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {searchValue.trim() ? (
                    <div className="py-6 text-center text-sm">
                      No customer found.
                    </div>
                  ) : (
                    <div className="py-6 text-center text-sm">
                      Start typing to search customers...
                    </div>
                  )}
                </CommandEmpty>
                {customers.length > 0 && (
                  <CommandGroup heading="Existing Customers">
                    {customers.map((customer) => {
                      // Create a unique value for each customer to prevent hover issues
                      // Format: "customer_name|email|contact_number"
                      const uniqueValue = `${customer.customer_name}|${customer.email || ""}|${customer.contact_number || ""}`;

                      // Check if this specific customer is selected by comparing unique values
                      const isSelected =
                        uniqueValue === selectedCustomerUniqueId;

                      return (
                        <CommandItem
                          key={`${customer.customer_name}_${customer.email || ""}_${customer.contact_number || ""}`}
                          value={uniqueValue}
                          onSelect={handleSelect}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              isSelected ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-medium truncate">
                              {customer.customer_name}
                            </span>
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              {customer.email && (
                                <span className="text-xs text-muted-foreground truncate">
                                  {customer.email}
                                </span>
                              )}
                              {customer.contact_person_name && (
                                <span className="text-xs text-muted-foreground truncate">
                                  {customer.contact_person_name}
                                </span>
                              )}
                              {customer.address_city && (
                                <span className="text-xs text-muted-foreground truncate">
                                  {customer.address_city}
                                  {customer.address_state &&
                                    `, ${customer.address_state}`}
                                </span>
                              )}
                            </div>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
                {searchValue.trim() && (
                  <CommandGroup heading="Create New">
                    <CommandItem
                      onSelect={handleCreateNew}
                      className="cursor-pointer"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      <span>Create &quot;{searchValue.trim()}&quot;</span>
                    </CommandItem>
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
