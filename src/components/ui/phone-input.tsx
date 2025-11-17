"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Contact, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  isContactsPickerAvailable,
  selectContact,
  extractPhoneFromContact,
} from "@/lib/utils/contacts";
import { toast } from "sonner";

interface PhoneInputProps
  extends Omit<React.ComponentProps<typeof Input>, "onChange" | "value"> {
  value?: string;
  onChange?: (value: string) => void;
  defaultCountryCode?: string;
}

/**
 * Phone input component with Indian formatting (+91 XXXXX XXXXX)
 */
export function PhoneInput({
  className,
  value = "",
  onChange,
  defaultCountryCode = "+91",
  ...props
}: PhoneInputProps) {
  const formatPhoneNumber = React.useCallback(
    (input: string, countryCode: string): string => {
      // Remove all non-digit characters except +
      let digits = input.replace(/[^\d+]/g, "");

      // Handle different input formats
      if (digits.startsWith("+91")) {
        // Already has +91
        digits = digits;
      } else if (digits.startsWith("91") && !digits.startsWith("+")) {
        // Has 91 but no +
        digits = "+" + digits;
      } else if (digits.startsWith("0")) {
        // Remove leading 0 and add country code
        digits = countryCode + digits.slice(1);
      } else if (digits.length > 0 && !digits.startsWith("+")) {
        // Just digits, add country code
        digits = countryCode + digits;
      } else if (digits.length === 0) {
        // Empty, return just country code with space
        return countryCode + " ";
      }

      // Ensure it starts with +91
      if (!digits.startsWith("+91")) {
        // Remove any existing + and add +91
        digits = countryCode + digits.replace(/^\+/, "");
      }

      // Get the number part (after +91)
      const numberPart = digits.replace(/^\+91/, "").replace(/\D/g, "");

      // Limit to 10 digits (Indian phone numbers)
      const limitedNumber = numberPart.slice(0, 10);

      // Format: +91 XXXXX XXXXX (5-5 split)
      if (limitedNumber.length === 0) {
        return countryCode + " ";
      } else if (limitedNumber.length <= 5) {
        return countryCode + " " + limitedNumber;
      } else {
        return (
          countryCode +
          " " +
          limitedNumber.slice(0, 5) +
          " " +
          limitedNumber.slice(5)
        );
      }
    },
    []
  );

  const [displayValue, setDisplayValue] = React.useState(() => {
    if (value) {
      return formatPhoneNumber(value, defaultCountryCode);
    }
    return defaultCountryCode + " ";
  });

  // Initialize display value
  React.useEffect(() => {
    if (value) {
      setDisplayValue(formatPhoneNumber(value, defaultCountryCode));
    } else {
      setDisplayValue(defaultCountryCode + " ");
    }
  }, [value, defaultCountryCode, formatPhoneNumber]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formatted = formatPhoneNumber(input, defaultCountryCode);
    setDisplayValue(formatted);

    // Extract the full number for storage: +91XXXXXXXXXX (no spaces)
    const fullNumber = formatted.replace(/\s/g, "");
    onChange?.(fullNumber);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow backspace, delete, arrow keys, tab
    if (
      ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(
        e.key
      ) ||
      (e.ctrlKey && ["a", "c", "v", "x"].includes(e.key.toLowerCase()))
    ) {
      return;
    }

    // Prevent non-digit input (except + which is handled)
    if (!/[0-9+]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  };

  // Contact picker state
  const [isContactPickerAvailable, setIsContactPickerAvailable] =
    React.useState(false);
  const [isLoadingContact, setIsLoadingContact] = React.useState(false);

  // Check if contact picker is available
  React.useEffect(() => {
    const checkAvailability = () => {
      const available = isContactsPickerAvailable();
      setIsContactPickerAvailable(available);
    };

    checkAvailability();
  }, []);

  // Handle contact selection
  const handleContactSelect = React.useCallback(async () => {
    // If API is not available, show informative message
    if (!isContactPickerAvailable) {
      toast.info(
        "Contact picker is not available in this browser. Please enter the phone number manually.",
        {
          duration: 3000,
        }
      );
      return;
    }

    if (isLoadingContact || props.disabled) {
      return;
    }

    setIsLoadingContact(true);

    try {
      const contact = await selectContact();

      if (!contact) {
        // User cancelled, no error needed
        return;
      }

      const phoneNumber = extractPhoneFromContact(contact);

      if (!phoneNumber) {
        toast.error(
          "Selected contact does not have a valid Indian phone number"
        );
        return;
      }

      // Update the phone number
      const formatted = formatPhoneNumber(phoneNumber, defaultCountryCode);
      setDisplayValue(formatted);
      const fullNumber = formatted.replace(/\s/g, "");
      onChange?.(fullNumber);

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
        // If user cancelled, silently fail (no toast)
      } else {
        toast.error("Failed to select contact. Please try again.");
      }
    } finally {
      setIsLoadingContact(false);
    }
  }, [
    isContactPickerAvailable,
    isLoadingContact,
    props.disabled,
    defaultCountryCode,
    formatPhoneNumber,
    onChange,
  ]);

  return (
    <div className="relative w-full">
      <Input
        {...props}
        type="tel"
        autoComplete="tel"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={cn(className, "pr-10")}
        placeholder={defaultCountryCode + " XXXXX XXXXX"}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 z-10",
              "hover:bg-muted",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              !isContactPickerAvailable && "opacity-60",
              props.disabled && "pointer-events-none"
            )}
            onClick={handleContactSelect}
            disabled={isLoadingContact || props.disabled}
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
    </div>
  );
}
