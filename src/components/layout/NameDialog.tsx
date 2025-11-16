"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { toast } from "sonner";

const nameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
});

type NameFormValues = z.infer<typeof nameSchema>;

interface NameDialogProps {
  open: boolean;
  onNameSet: (name: string) => Promise<void> | void;
}

export function NameDialog({ open, onNameSet }: NameDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<NameFormValues>({
    resolver: zodResolver(nameSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: NameFormValues) => {
    setIsLoading(true);
    try {
      const trimmedName = data.name.trim();
      
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Failed to update name:", result.error);
        toast.error(result.error || "Failed to update name");
        setIsLoading(false);
        return;
      }

      console.log("Name updated successfully:", trimmedName);
      toast.success("Name updated successfully!");
      onNameSet(trimmedName);
      reset();
    } catch (error) {
      console.error("Error updating name:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-[425px]"
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Set Your Display Name</DialogTitle>
          <DialogDescription>
            Please enter your name to continue. This will be displayed in
            the sidebar and throughout the application.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">
                Name <span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                id="name"
                placeholder="Enter your name"
                {...register("name")}
                disabled={isLoading}
                autoFocus
                aria-invalid={!!errors.name}
              />
              <FieldError
                errors={
                  errors.name
                    ? [{ message: errors.name.message }]
                    : undefined
                }
              />
            </Field>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Name"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
