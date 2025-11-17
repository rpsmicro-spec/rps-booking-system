"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Contact,
  Loader2,
  Check,
  X,
  ClipboardPaste,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  isContactsPickerAvailable,
  selectContact,
  extractPhoneFromContact,
} from "@/lib/utils/contacts";
import {
  getRecentContacts,
  addRecentContact,
  formatPhoneForDisplay,
  type RecentContact,
} from "@/lib/utils/recent-contacts";
import { toast } from "sonner";
import { PhoneInput as InternationalPhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

interface EnhancedPhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  defaultCountry?: string;
  showContactPicker?: boolean;
  showClipboardPaste?: boolean;
  showValidation?: boolean;
  showRecentContacts?: boolean;
  contactName?: string; // Name to associate with this contact
  id?: string;
  name?: string;
  "aria-invalid"?: boolean;
}

/**
 * Enhanced phone input component with:
 * - Country selector with flags
 * - Contact picker integration
 * - Clipboard detection
 * - Real-time validation
 * - Auto-formatting per country
 */
export function EnhancedPhoneInput({
  value = "",
  onChange,
  disabled = false,
  className,
  placeholder,
  defaultCountry = "in",
  showContactPicker = true,
  showClipboardPaste = true,
  showValidation = true,
  showRecentContacts = true,
  contactName,
  id,
  name,
  "aria-invalid": ariaInvalid,
}: EnhancedPhoneInputProps) {
  const [isContactPickerAvailable, setIsContactPickerAvailable] =
    React.useState(false);
  const [isLoadingContact, setIsLoadingContact] = React.useState(false);
  const [clipboardPhone, setClipboardPhone] = React.useState<string | null>(
    null
  );
  const [isValid, setIsValid] = React.useState<boolean | null>(null);
  const [recentContacts, setRecentContacts] = React.useState<RecentContact[]>(
    []
  );
  const [showRecents, setShowRecents] = React.useState(false);

  // Check if contact picker is available
  React.useEffect(() => {
    const available = isContactsPickerAvailable();
    setIsContactPickerAvailable(available);
  }, []);

  // Load recent contacts
  React.useEffect(() => {
    if (!showRecentContacts) return;
    const contacts = getRecentContacts();
    setRecentContacts(contacts);
  }, [showRecentContacts]);

  // Validate phone number - Indian format only
  const validatePhone = React.useCallback((phone: string): boolean => {
    if (!phone || phone.trim() === "") return false;
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, "");
    const digits = cleaned.replace(/\D/g, "");

    // Indian phone numbers: Must be exactly 10 digits starting with 6-9
    // Or 12 digits if starting with 91 (country code)
    if (digits.length === 10) {
      return /^[6-9]\d{9}$/.test(digits);
    }
    if (digits.length === 12 && digits.startsWith("91")) {
      return /^91[6-9]\d{9}$/.test(digits);
    }
    return false;
  }, []);

  // Update validation status when value changes
  React.useEffect(() => {
    if (!showValidation) return;
    if (!value || value.trim() === "") {
      setIsValid(null);
      return;
    }
    const valid = validatePhone(value);
    setIsValid(valid);
  }, [value, validatePhone, showValidation]);

  // Normalize phone number to Indian format with +91
  const normalizeToIndianFormat = React.useCallback(
    (phone: string): string | null => {
      if (!phone) return null;

      // Remove all non-digit characters except +
      const cleaned = phone.replace(/[^\d+]/g, "");
      let digits = cleaned.replace(/\D/g, "");

      // Remove leading zeros
      digits = digits.replace(/^0+/, "");

      // Handle different formats
      if (digits.startsWith("91")) {
        // Already has 91, extract the 10-digit number
        digits = digits.slice(2);
      }

      // Validate it's a 10-digit Indian number starting with 6-9
      if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
        return `+91${digits}`;
      }

      return null;
    },
    []
  );

  // Check clipboard for phone number on mount
  React.useEffect(() => {
    if (!showClipboardPaste) return;

    const checkClipboard = async () => {
      try {
        // Check if clipboard API is available
        if (!navigator.clipboard || !navigator.clipboard.readText) return;

        const text = await navigator.clipboard.readText();
        if (!text) return;

        // Normalize to Indian format
        const normalized = normalizeToIndianFormat(text);

        if (normalized) {
          // Don't show if it matches current value
          const currentNormalized = normalizeToIndianFormat(value);
          if (normalized !== currentNormalized && !value) {
            setClipboardPhone(normalized);
          }
        }
      } catch {
        // Clipboard access denied or not available - silently fail
      }
    };

    checkClipboard();
  }, [showClipboardPaste, value, normalizeToIndianFormat]);

  // Handle contact selection
  const handleContactSelect = React.useCallback(async () => {
    if (!isContactPickerAvailable) {
      toast.info(
        "Contact picker is not available in this browser. Please enter the phone number manually.",
        { duration: 3000 }
      );
      return;
    }

    if (isLoadingContact || disabled) return;

    setIsLoadingContact(true);

    try {
      const contact = await selectContact();

      if (!contact) return;

      const phoneNumber = extractPhoneFromContact(contact);

      if (!phoneNumber) {
        toast.error(
          "Selected contact does not have a valid Indian phone number"
        );
        return;
      }

      // Normalize to Indian format with +91
      const normalized = normalizeToIndianFormat(phoneNumber);

      if (!normalized) {
        toast.error(
          "Selected contact does not have a valid Indian phone number"
        );
        return;
      }

      onChange?.(normalized);
      toast.success("Phone number filled from contact");
    } catch (error) {
      console.error("Error selecting contact:", error);
      if (error instanceof Error) {
        if (
          error.message.includes("permission") ||
          error.message.includes("denied")
        ) {
          toast.error(
            "Permission denied. Please allow contacts access in your browser settings."
          );
        } else if (
          !error.message.includes("cancel") &&
          !error.message.includes("Abort")
        ) {
          toast.error("Failed to select contact. Please try again.");
        }
      } else {
        toast.error("Failed to select contact. Please try again.");
      }
    } finally {
      setIsLoadingContact(false);
    }
  }, [
    isContactPickerAvailable,
    isLoadingContact,
    disabled,
    onChange,
    normalizeToIndianFormat,
  ]);

  // Handle paste from clipboard
  const handleClipboardPaste = React.useCallback(() => {
    if (!clipboardPhone) return;
    onChange?.(clipboardPhone);
    setClipboardPhone(null);
    toast.success("Phone number pasted from clipboard");
  }, [clipboardPhone, onChange]);

  // Handle recent contact selection
  const handleRecentContactSelect = React.useCallback(
    (contact: RecentContact) => {
      onChange?.(contact.phone);
      setShowRecents(false);
      toast.success("Recent contact selected");
    },
    [onChange]
  );

  // Save to recent contacts when value changes (with debounce)
  React.useEffect(() => {
    if (!value || !validatePhone(value)) return;

    const timer = setTimeout(() => {
      addRecentContact(value, contactName);
      // Refresh recent contacts list
      if (showRecentContacts) {
        setRecentContacts(getRecentContacts());
      }
    }, 2000); // Debounce for 2 seconds

    return () => clearTimeout(timer);
  }, [value, contactName, validatePhone, showRecentContacts]);

  return (
    <div className="relative w-full space-y-2">
      {/* Clipboard paste suggestion */}
      {clipboardPhone && showClipboardPaste && (
        <div className="flex items-center gap-2 p-2 text-sm bg-muted rounded-md">
          <ClipboardPaste className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-muted-foreground">
            Paste <strong className="text-foreground">{clipboardPhone}</strong>?
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleClipboardPaste}
            className="h-7 px-2"
          >
            Paste
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setClipboardPhone(null)}
            className="h-7 w-7 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Phone input with country selector */}
      <div className="relative">
        <InternationalPhoneInput
          defaultCountry={defaultCountry}
          value={value}
          onChange={(phone) => {
            // Always normalize to Indian format with +91
            const normalized = normalizeToIndianFormat(phone);
            if (normalized) {
              onChange?.(normalized);
            } else if (phone === "" || phone === "+91") {
              // Allow clearing the field
              onChange?.("");
            } else {
              // If it's not a valid Indian number, still update to show user input
              // but validation will show it as invalid
              onChange?.(phone);
            }
          }}
          disabled={disabled}
          disableCountryGuess={true}
          forceDialCode={true}
          inputProps={{
            id,
            name,
            placeholder: placeholder || "Enter phone number",
            "aria-invalid": ariaInvalid,
            autoComplete: "tel",
            className: cn(
              "flex h-9 w-full rounded-r-md rounded-l-none border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              // Add padding for action buttons based on what's showing
              showValidation && isValid !== null && "pr-24",
              !showValidation &&
                showRecentContacts &&
                recentContacts.length > 0 &&
                "pr-16",
              !showValidation &&
                (!showRecentContacts || recentContacts.length === 0) &&
                showContactPicker &&
                "pr-10",
              className
            ),
          }}
          countrySelectorStyleProps={{
            buttonClassName: cn(
              "h-9 min-w-[70px] border-r-0 rounded-l-md pointer-events-none",
              disabled && "opacity-50 cursor-not-allowed"
            ),
            dropdownStyleProps: {
              className: "z-50 hidden", // Hide dropdown since we're locking to India
            },
          }}
          className="enhanced-phone-input"
        />

        {/* Action buttons */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
          {/* Validation indicator */}
          {showValidation && isValid === true && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-7 w-7 flex items-center justify-center">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
              </TooltipTrigger>
              <TooltipContent>Valid phone number</TooltipContent>
            </Tooltip>
          )}

          {showValidation && isValid === false && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-7 w-7 flex items-center justify-center">
                  <X className="h-4 w-4 text-destructive" />
                </div>
              </TooltipTrigger>
              <TooltipContent>Invalid phone number</TooltipContent>
            </Tooltip>
          )}

          {/* Recent contacts button */}
          {showRecentContacts && recentContacts.length > 0 && (
            <Popover open={showRecents} onOpenChange={setShowRecents}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-7 w-7",
                        "hover:bg-muted",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        disabled && "pointer-events-none"
                      )}
                      disabled={disabled}
                      aria-label="Select from recent contacts"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Recent contacts</TooltipContent>
              </Tooltip>
              <PopoverContent className="p-0 w-[300px]" align="end">
                <Command>
                  <CommandList>
                    <CommandEmpty>No recent contacts found.</CommandEmpty>
                    <CommandGroup heading="Recent Contacts">
                      {recentContacts.map((contact, index) => (
                        <CommandItem
                          key={`${contact.phone}-${index}`}
                          onSelect={() => handleRecentContactSelect(contact)}
                          className="flex flex-col items-start gap-1 py-2 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 w-full">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">
                              {formatPhoneForDisplay(contact.phone)}
                            </span>
                          </div>
                          {contact.name && (
                            <span className="text-xs text-muted-foreground ml-5">
                              {contact.name}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground ml-5">
                            Used {contact.useCount} time
                            {contact.useCount !== 1 ? "s" : ""}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}

          {/* Contact picker button */}
          {showContactPicker && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7",
                    "hover:bg-muted",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    !isContactPickerAvailable && "opacity-60",
                    disabled && "pointer-events-none"
                  )}
                  onClick={handleContactSelect}
                  disabled={isLoadingContact || disabled}
                  aria-label={
                    isContactPickerAvailable
                      ? "Select contact from phone"
                      : "Contact picker not available in this browser"
                  }
                >
                  {isLoadingContact ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Contact className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isContactPickerAvailable
                  ? "Select contact from phone"
                  : "Contact picker not available. Please enter phone number manually."}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
