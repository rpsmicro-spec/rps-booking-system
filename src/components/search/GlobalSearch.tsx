"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Briefcase, Users, Loader2, X, Search } from "lucide-react";
import type { Job } from "@/types/types";
import { Customer } from "@/features/jobs/components/CustomerCombobox";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResult {
  type: "job" | "customer";
  id: string;
  title: string;
  subtitle?: string;
  url: string;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setResults([]);
      return;
    }
    // Focus input when opened
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [open]);

  useEffect(() => {
    if (!search.trim() || search.length < 2) {
      setResults([]);
      return;
    }

    const searchQuery = search.trim();
    setIsLoading(true);

    // Debounce search
    const timeoutId = setTimeout(async () => {
      try {
        // Search jobs and customers in parallel
        const [jobsResponse, customersResponse] = await Promise.all([
          fetch(`/api/jobs?search=${encodeURIComponent(searchQuery)}&limit=5`),
          fetch(
            `/api/customers?search=${encodeURIComponent(searchQuery)}&limit=5`
          ),
        ]);

        const searchResults: SearchResult[] = [];

        // Process jobs
        if (jobsResponse.ok) {
          const jobsData = await jobsResponse.json();
          if (jobsData.jobs) {
            jobsData.jobs.forEach((job: Job) => {
              searchResults.push({
                type: "job",
                id: job.id,
                title: job.job_number || "Unknown Job",
                subtitle: `${job.customer_name}${job.email ? ` • ${job.email}` : ""}`,
                url: `/jobs/${job.id}`,
              });
            });
          }
        }

        // Process customers
        if (customersResponse.ok) {
          const customersData = await customersResponse.json();
          if (customersData.customers) {
            customersData.customers.forEach((customer: Customer) => {
              const customerKey = encodeURIComponent(customer.customer_name);
              searchResults.push({
                type: "customer",
                id: customerKey,
                title: customer.customer_name,
                subtitle: customer.email
                  ? `${customer.email}${customer.contact_number ? ` • ${customer.contact_number}` : ""}`
                  : customer.contact_number || undefined,
                url: `/customers/${customerKey}`,
              });
            });
          }
        }

        setResults(searchResults);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  const handleSelect = (result: SearchResult) => {
    router.push(result.url);
    onOpenChange(false);
    setSearch("");
  };

  const jobs = results.filter((r) => r.type === "job");
  const customers = results.filter((r) => r.type === "customer");

  // Handle Escape key to close
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 backdrop-blur-md bg-background/20 z-40"
        onClick={() => onOpenChange(false)}
      />

      {/* Search Bar */}
      <div className="fixed inset-x-0 top-0 z-50 bg-background border-b shadow-lg animate-in slide-in-from-top duration-200">
        <div className="container mx-auto max-w-4xl">
          <div className="p-3 md:p-4">
            <Command className="w-full border rounded-lg">
              <div className="flex items-center gap-2 border-b px-3">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                ) : (
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search jobs, customers, job numbers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                />
                <button
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors shrink-0"
                  aria-label="Close search"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              {(isLoading || search.length >= 2 || results.length > 0) && (
                <CommandList className="max-h-[400px] border-t">
                  {isLoading && (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {!isLoading && search.length < 2 && (
                    <CommandEmpty>
                      Type at least 2 characters to search...
                    </CommandEmpty>
                  )}
                  {!isLoading && search.length >= 2 && results.length === 0 && (
                    <CommandEmpty>No results found.</CommandEmpty>
                  )}
                  {!isLoading && jobs.length > 0 && (
                    <CommandGroup heading="Jobs">
                      {jobs.map((result) => (
                        <CommandItem
                          key={result.id}
                          value={result.id}
                          onSelect={() => handleSelect(result)}
                          className="cursor-pointer"
                        >
                          <Briefcase className="mr-2 h-4 w-4" />
                          <div className="flex flex-col">
                            <span className="font-medium">{result.title}</span>
                            {result.subtitle && (
                              <span className="text-xs text-muted-foreground">
                                {result.subtitle}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {!isLoading && customers.length > 0 && (
                    <CommandGroup heading="Customers">
                      {customers.map((result) => (
                        <CommandItem
                          key={result.id}
                          value={result.id}
                          onSelect={() => handleSelect(result)}
                          className="cursor-pointer"
                        >
                          <Users className="mr-2 h-4 w-4" />
                          <div className="flex flex-col">
                            <span className="font-medium">{result.title}</span>
                            {result.subtitle && (
                              <span className="text-xs text-muted-foreground">
                                {result.subtitle}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              )}
            </Command>
          </div>
        </div>
      </div>
    </>
  );
}
