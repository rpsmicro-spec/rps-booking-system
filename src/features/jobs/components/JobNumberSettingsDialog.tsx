"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getFinancialYearString } from "@/lib/job-number";
import { USER_ROLES, type UserRole } from "@/lib/constants/roles";

const settingsSchema = z.object({
  prefix: z
    .string()
    .max(20, "Prefix must be less than 20 characters")
    .optional()
    .or(z.literal("")),
  next_number: z.number().int().min(1, "Next number must be at least 1"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface JobNumberSettings {
  id: string;
  prefix: string;
  number_base: "sequence" | "year";
  next_number: number;
  year?: number;
}

interface JobNumberSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobNumberSettingsDialog({
  open,
  onOpenChange,
}: JobNumberSettingsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      prefix: "RPS",
      next_number: 1,
    },
  });

  const prefix = watch("prefix") || "RPS";
  const nextNumber = watch("next_number") || 1;
  const financialYear = getFinancialYearString();

  // Calculate next reset date (April 1st of next financial year)
  const getNextResetDate = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (currentMonth >= 4) {
      // Currently in financial year, next reset is April 1st of next year
      return new Date(currentYear + 1, 3, 1); // Month 3 = April (0-indexed)
    } else {
      // Currently before April, next reset is April 1st of current year
      return new Date(currentYear, 3, 1); // Month 3 = April (0-indexed)
    }
  };

  const nextResetDate = getNextResetDate();
  const previewJobNumber = `${prefix}-${nextNumber}/${financialYear}`;

  // Check if user can edit settings (only owners and admins)
  const canEdit =
    userRole === USER_ROLES.OWNER || userRole === USER_ROLES.ADMIN;

  // Fetch user role
  useEffect(() => {
    fetch("/api/users/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.role) {
          setUserRole(data.user.role as UserRole);
        } else {
          setUserRole(USER_ROLES.STAFF);
        }
      })
      .catch(() => {
        setUserRole(USER_ROLES.STAFF);
      })
      .finally(() => {
        setIsLoadingRole(false);
      });
  }, []);

  // Fetch current settings
  useEffect(() => {
    if (open && !isLoadingRole) {
      fetchSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isLoadingRole]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/jobs/settings");
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = "Failed to fetch settings";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      const settings: JobNumberSettings = data.settings;

      reset({
        prefix: settings.prefix || "RPS",
        next_number: settings.next_number,
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load settings";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: SettingsFormValues) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/jobs/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save settings");
      }

      toast.success("Job number settings updated successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save settings"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Job Number Settings</DialogTitle>
          <DialogDescription>
            Configure job number prefix. Job numbers use financial year format
            (April 1 - March 31). Numbers automatically reset each April 1st.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Preview Section */}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Next Job Number Preview
                </Label>
                <span className="text-sm font-mono font-semibold text-foreground">
                  {previewJobNumber}
                </span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  Current Financial Year:{" "}
                  <span className="font-medium">{financialYear}</span> (April 1
                  - March 31)
                </p>
                <p>
                  Next Reset:{" "}
                  <span className="font-medium">
                    {nextResetDate.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prefix">Prefix</Label>
              <Input
                id="prefix"
                {...register("prefix")}
                placeholder="e.g., RPS"
                maxLength={20}
                disabled={!canEdit}
                readOnly={!canEdit}
              />
              {errors.prefix && (
                <p className="text-sm text-destructive">
                  {errors.prefix.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Prefix for job numbers. Default: RPS. Format:{" "}
                <span className="font-mono">
                  {prefix}-1/{financialYear}
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_number">Next Number</Label>
              <Input
                id="next_number"
                type="number"
                min="1"
                {...register("next_number", { valueAsNumber: true })}
                disabled={!canEdit}
                readOnly={!canEdit}
              />
              {errors.next_number && (
                <p className="text-sm text-destructive">
                  {errors.next_number.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                The next sequential number to use when generating a new job
                number. This will automatically increment after each job is
                created and reset to 1 on April 1st each year.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                {canEdit ? "Cancel" : "Close"}
              </Button>
              {canEdit && (
                <Button type="submit" disabled={isSaving}>
                  {isSaving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Settings
                </Button>
              )}
            </div>
            {!canEdit && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                Only owners and admins can edit settings.
              </p>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
