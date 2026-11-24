"use client";

import { useState } from "react";
import { EnhancedPhoneInput } from "./enhanced-phone-input";
import { Button } from "./button";
import { Label } from "./label";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiPhoneInputProps {
  primaryValue: string;
  additionalValues: string[];
  onPrimaryChange: (value: string) => void;
  onAdditionalChange: (values: string[]) => void;
  disabled?: boolean;
  contactName?: string;
  className?: string;
  /** Extra classes for each phone field (e.g. a height override). */
  inputClassName?: string;
}

export function MultiPhoneInput({
  primaryValue,
  additionalValues,
  onPrimaryChange,
  onAdditionalChange,
  disabled = false,
  contactName,
  className,
  inputClassName,
}: MultiPhoneInputProps) {
  const [additionalPhones, setAdditionalPhones] = useState<string[]>(
    additionalValues.length > 0 ? additionalValues : []
  );

  const handleAddPhone = () => {
    const newPhones = [...additionalPhones, ""];
    setAdditionalPhones(newPhones);
    onAdditionalChange(newPhones);
  };

  const handleRemovePhone = (index: number) => {
    const newPhones = additionalPhones.filter((_, i) => i !== index);
    setAdditionalPhones(newPhones);
    onAdditionalChange(newPhones);
  };

  const handleAdditionalPhoneChange = (index: number, value: string) => {
    const newPhones = [...additionalPhones];
    newPhones[index] = value;
    setAdditionalPhones(newPhones);
    onAdditionalChange(newPhones);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Primary Phone Number */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Label htmlFor="primary_contact_number" className="text-muted-foreground">
            Primary Phone Number
          </Label>
          <span className="text-xs text-muted-foreground">(WhatsApp notifications)</span>
        </div>
        <EnhancedPhoneInput
          id="primary_contact_number"
          name="primary_contact_number"
          value={primaryValue || ""}
          onChange={(value) => onPrimaryChange(value || "")}
          disabled={disabled}
          contactName={contactName}
          placeholder="Enter primary phone number"
          showContactPicker={true}
          showClipboardPaste={true}
          showValidation={true}
          showRecentContacts={true}
          className={inputClassName}
        />
      </div>

      {/* Additional Phone Numbers */}
      {additionalPhones.map((phone, index) => (
        <div key={index} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label
              htmlFor={`additional_phone_${index}`}
              className="text-muted-foreground"
            >
              Additional Phone #{index + 1}
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemovePhone(index)}
              disabled={disabled}
              className="h-6 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-3 w-3 mr-1" />
              Remove
            </Button>
          </div>
          <EnhancedPhoneInput
            id={`additional_phone_${index}`}
            name={`additional_phone_${index}`}
            value={phone}
            onChange={(value) => handleAdditionalPhoneChange(index, value || "")}
            disabled={disabled}
            contactName={contactName}
            placeholder="Enter additional phone number"
            showContactPicker={true}
            showClipboardPaste={true}
            showValidation={true}
            showRecentContacts={false}
            className={inputClassName}
          />
        </div>
      ))}

      {/* Add More Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddPhone}
        disabled={disabled || additionalPhones.length >= 5}
        className="w-full text-xs"
      >
        <Plus className="h-3 w-3 mr-1.5" />
        Add Additional Phone Number
        {additionalPhones.length >= 5 && " (Max 5 reached)"}
      </Button>
      {additionalPhones.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Additional numbers are for reference only. WhatsApp messages will be sent to the primary number.
        </p>
      )}
    </div>
  );
}

