"use client";

import { useState } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiEmailInputProps {
  primaryValue: string;
  additionalValues: string[];
  onPrimaryChange: (value: string) => void;
  onAdditionalChange: (values: string[]) => void;
  disabled?: boolean;
  className?: string;
  primaryError?: string;
  additionalErrors?: string[];
}

export function MultiEmailInput({
  primaryValue,
  additionalValues,
  onPrimaryChange,
  onAdditionalChange,
  disabled = false,
  className,
  primaryError,
}: MultiEmailInputProps) {
  const [additionalEmails, setAdditionalEmails] = useState<string[]>(
    additionalValues.length > 0 ? additionalValues : []
  );

  const handleAddEmail = () => {
    const newEmails = [...additionalEmails, ""];
    setAdditionalEmails(newEmails);
    onAdditionalChange(newEmails);
  };

  const handleRemoveEmail = (index: number) => {
    const newEmails = additionalEmails.filter((_, i) => i !== index);
    setAdditionalEmails(newEmails);
    onAdditionalChange(newEmails);
  };

  const handleAdditionalEmailChange = (index: number, value: string) => {
    const newEmails = [...additionalEmails];
    newEmails[index] = value;
    setAdditionalEmails(newEmails);
    onAdditionalChange(newEmails);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Primary Email */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            Primary Email Address
          </label>
          <span className="text-xs text-muted-foreground">(for notifications)</span>
        </div>
        <Input
          id="primary_email"
          name="primary_email"
          type="email"
          value={primaryValue || ""}
          onChange={(e) => onPrimaryChange(e.target.value)}
          disabled={disabled}
          placeholder="customer@email.com"
          className="text-sm sm:text-base"
          aria-invalid={!!primaryError}
        />
        {primaryError && (
          <p className="text-xs text-destructive mt-1">{primaryError}</p>
        )}
      </div>

      {/* Additional Emails */}
      {additionalEmails.map((email, index) => (
        <div key={index} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">
              Additional Email #{index + 1}
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveEmail(index)}
              disabled={disabled}
              className="h-6 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-3 w-3 mr-1" />
              Remove
            </Button>
          </div>
          <Input
            id={`additional_email_${index}`}
            name={`additional_email_${index}`}
            type="email"
            value={email}
            onChange={(e) => handleAdditionalEmailChange(index, e.target.value)}
            disabled={disabled}
            placeholder="additional@email.com"
            className="text-sm sm:text-base"
          />
        </div>
      ))}

      {/* Add More Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddEmail}
        disabled={disabled || additionalEmails.length >= 5}
        className="w-full text-xs"
      >
        <Plus className="h-3 w-3 mr-1.5" />
        Add Additional Email Address
        {additionalEmails.length >= 5 && " (Max 5 reached)"}
      </Button>
      {additionalEmails.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Additional emails can be CC&apos;d when sending notifications (you&apos;ll be asked each time).
        </p>
      )}
    </div>
  );
}

