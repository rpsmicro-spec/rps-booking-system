"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { MediaUpload } from "./MediaUpload";
import { InvoiceUpload } from "./InvoiceUpload";
import { SimpleDatePicker } from "./SimpleDatePicker";
import { StateCombobox } from "./StateCombobox";
import { CityCombobox } from "./CityCombobox";
import { CustomerCombobox, type Customer } from "./CustomerCombobox";
import { MultiPhoneInput } from "@/components/ui/multi-phone-input";
import { MultiEmailInput } from "@/components/ui/multi-email-input";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Job } from "@/types/types";

// Job number validation (alphanumeric with optional dashes, underscores, and forward slashes for financial year format)
// Format: RPS-1/25-26
const jobNumberRegex = /^[A-Za-z0-9\-_\/]+$/;

const jobSchema = z
  .object({
    customer_name: z
      .string()
      .trim()
      .min(2, "Company name must be at least 2 characters")
      .max(100, "Company name must be less than 100 characters"),
    contact_person_name: z
      .string()
      .trim()
      .max(100, "Contact person name must be less than 100 characters")
      .optional()
      .or(z.literal("")),
    contact_person_designation: z
      .string()
      .trim()
      .max(100, "Designation must be less than 100 characters")
      .optional()
      .or(z.literal("")),
    customer_dc_number: z
      .string()
      .trim()
      .max(100, "DC number must be less than 100 characters")
      .optional()
      .or(z.literal("")),
    customer_dc_date: z
      .string()
      .trim()
      .refine(
        (val) => !val || !isNaN(new Date(val).getTime()),
        "Please enter a valid DC date"
      )
      .optional()
      .or(z.literal("")),
    job_number: z
      .string()
      .min(1, "Job number is required")
      .trim()
      .min(2, "Job number must be at least 2 characters")
      .max(50, "Job number must be less than 50 characters")
      .regex(
        jobNumberRegex,
        "Job number can only contain letters, numbers, dashes, underscores, and forward slashes"
      ),
    address_street: z
      .string()
      .trim()
      .max(200, "Street address must be less than 200 characters")
      .optional()
      .or(z.literal("")),
    address_area: z
      .string()
      .trim()
      .max(100, "Area must be less than 100 characters")
      .optional()
      .or(z.literal("")),
    address_city: z
      .string()
      .trim()
      .max(100, "City must be less than 100 characters")
      .optional()
      .or(z.literal("")),
    address_state: z
      .string()
      .trim()
      .max(100, "State must be less than 100 characters")
      .optional()
      .or(z.literal("")),
    address_pincode: z
      .string()
      .trim()
      .max(10, "Pincode must be less than 10 characters")
      .regex(/^[0-9]{6}$|^$/, "Pincode must be 6 digits")
      .optional()
      .or(z.literal("")),
    contact_number: z
      .string()
      .trim()
      .refine((val) => {
        if (!val || val.trim() === "") return true; // Optional
        // Remove spaces and + for validation
        const cleaned = val.replace(/[\s\+]/g, "");
        // Should be 91 followed by 10 digits (total 12 digits) or just 10 digits starting with 6-9
        return /^(91)?[6-9]\d{9}$/.test(cleaned);
      }, "Please enter a valid Indian phone number")
      .optional()
      .or(z.literal("")),
    phone_numbers: z.array(z.string()).optional().or(z.literal(null)),
    email: z
      .string()
      .trim()
      .email("Invalid email address")
      .max(255, "Email must be less than 255 characters")
      .optional()
      .or(z.literal("")),
    emails: z
      .array(z.string().email("Invalid email address"))
      .optional()
      .or(z.literal(null)),
    material_type: z
      .string()
      .trim()
      .max(100, "Material type must be less than 100 characters")
      .optional()
      .or(z.literal("")),
    booking_date: z
      .string()
      .min(1, "Booking date is required")
      .refine((val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
      }, "Please enter a valid booking date"),
    delivery_date: z
      .string()
      .trim()
      .refine(
        (val) => !val || !isNaN(new Date(val).getTime()),
        "Please enter a valid delivery date"
      )
      .optional()
      .or(z.literal("")),
    special_requirements: z
      .string()
      .trim()
      .max(2000, "Special requirements must be less than 2000 characters")
      .optional()
      .or(z.literal("")),
    notes: z
      .string()
      .trim()
      .max(5000, "Notes must be less than 5000 characters")
      .optional()
      .or(z.literal("")),
    before_photos: z
      .array(z.union([z.string().url("Invalid photo URL"), z.instanceof(File)]))
      .max(10, "Maximum 10 before photos allowed")
      .optional(),
    after_photos: z
      .array(z.union([z.string().url("Invalid photo URL"), z.instanceof(File)]))
      .max(10, "Maximum 10 after photos allowed")
      .optional(),
    invoice_file_path: z
      .union([
        z.string().url("Invalid invoice URL"),
        z.instanceof(File),
        z.literal(""), // Allow empty string
      ])
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    // Delivery date must be after booking date if both are provided
    if (data.delivery_date && data.booking_date) {
      const bookingDate = new Date(data.booking_date);
      const deliveryDate = new Date(data.delivery_date);
      if (deliveryDate < bookingDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Delivery date must be on or after booking date",
          path: ["delivery_date"],
        });
      }
    }
  });

type JobFormValues = z.infer<typeof jobSchema>;

interface JobFormProps {
  job?: Job;
  onSubmit: (data: JobFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

// Helper function to extract date from ISO datetime string
const extractDate = (datetime: string | null | undefined): string => {
  if (!datetime) return "";
  return new Date(datetime).toISOString().split("T")[0];
};

const STORAGE_KEY = "job-form-draft";

// Helper functions for sessionStorage
// sessionStorage persists during the session (refresh/navigation) but clears when browser/app closes
const saveFormData = (data: Partial<JobFormValues>) => {
  try {
    // Filter out File objects - they can't be serialized to JSON
    // Only save string URLs (already uploaded photos)
    const serializableData: Partial<JobFormValues> = {
      ...data,
      before_photos: data.before_photos
        ? data.before_photos.filter(
            (photo): photo is string => typeof photo === "string"
          )
        : undefined,
      after_photos: data.after_photos
        ? data.after_photos.filter(
            (photo): photo is string => typeof photo === "string"
          )
        : undefined,
      invoice_file_path:
        typeof data.invoice_file_path === "string"
          ? data.invoice_file_path
          : undefined,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(serializableData));
  } catch (error) {
    // Ignore sessionStorage errors (e.g., quota exceeded, private mode)
    console.warn("Failed to save form data to sessionStorage:", error);
  }
};

const loadFormData = (): Partial<JobFormValues> | null => {
  try {
    const data = sessionStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn("Failed to load form data from sessionStorage:", error);
    return null;
  }
};

const clearFormData = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear form data from sessionStorage:", error);
  }
};

export function JobForm({ job, onSubmit, isSubmitting = false }: JobFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [autoGeneratedJobNumber, setAutoGeneratedJobNumber] = useState<
    string | null
  >(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const hasRestoredRef = useRef(false);
  const isInitialMountRef = useRef(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [originalCustomerData, setOriginalCustomerData] =
    useState<Customer | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting: isFormSubmitting },
    reset,
    setValue,
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    mode: "onChange",
    defaultValues: job
      ? {
          customer_name: job.customer_name,
          contact_person_name:
            (job as Job & { contact_person_name?: string })
              .contact_person_name || "",
          contact_person_designation:
            (job as Job & { contact_person_designation?: string })
              .contact_person_designation || "",
          customer_dc_number:
            (job as Job & { customer_dc_number?: string }).customer_dc_number ||
            "",
          customer_dc_date: extractDate(
            (job as Job & { customer_dc_date?: string }).customer_dc_date
          ),
          job_number: job.job_number,
          address_street:
            (job as Job & { address_street?: string }).address_street || "",
          address_area:
            (job as Job & { address_area?: string }).address_area || "",
          address_city:
            (job as Job & { address_city?: string }).address_city || "",
          address_state:
            (job as Job & { address_state?: string }).address_state || "",
          address_pincode:
            (job as Job & { address_pincode?: string }).address_pincode || "",
          contact_number: job.contact_number || "",
          phone_numbers:
            (job as Job & { phone_numbers?: string[] }).phone_numbers || [],
          email: job.email || "",
          emails: (job as Job & { emails?: string[] }).emails || [],
          material_type: job.material_type || "",
          booking_date: extractDate(job.booking_date),
          delivery_date: extractDate(job.delivery_date),
          special_requirements: job.special_requirements || "",
          notes: (job as Job & { notes?: string }).notes || "",
          invoice_file_path: job.invoice_file_path || "",
          before_photos: job.before_photos || [],
          after_photos: job.after_photos || [],
        }
      : {
          job_number: autoGeneratedJobNumber || "",
          booking_date: new Date().toISOString().split("T")[0], // Auto-set to today
          address_street: "",
          address_area: "",
          address_city: "",
          address_state: "",
          address_pincode: "",
          contact_person_name: "",
          contact_person_designation: "",
          customer_dc_number: "",
          customer_dc_date: "",
          phone_numbers: [],
          emails: [],
          notes: "",
          before_photos: [],
          after_photos: [],
        },
  });

  // Watch all form values for persistence (only for new jobs)
  const formValues = watch();

  // Restore form data from sessionStorage on mount (only for new jobs)
  useEffect(() => {
    if (!job && isInitialMountRef.current) {
      isInitialMountRef.current = false;
      const savedData = loadFormData();

      // Check if there's meaningful data to restore (not just empty values)
      const hasMeaningfulData = (
        data: Partial<JobFormValues> | null
      ): boolean => {
        if (!data || Object.keys(data).length === 0) return false;

        // Check if any field has a non-empty value
        const hasValue = (value: unknown): boolean => {
          if (value === null || value === undefined) return false;
          if (typeof value === "string") return value.trim().length > 0;
          if (typeof value === "number") return true;
          if (Array.isArray(value)) return value.length > 0;
          if (typeof value === "object") return Object.keys(value).length > 0;
          return Boolean(value);
        };

        return Object.values(data).some(hasValue);
      };

      if (savedData && hasMeaningfulData(savedData)) {
        // Filter photos to only include strings (File objects can't be restored from sessionStorage)
        const beforePhotos = Array.isArray(savedData.before_photos)
          ? savedData.before_photos.filter(
              (photo): photo is string => typeof photo === "string"
            )
          : [];
        const afterPhotos = Array.isArray(savedData.after_photos)
          ? savedData.after_photos.filter(
              (photo): photo is string => typeof photo === "string"
            )
          : [];

        // Check if we're restoring photos (indicates there might have been File objects that were lost)
        const hasRestoredPhotos =
          beforePhotos.length > 0 || afterPhotos.length > 0;

        // Restore saved data with defaults for address fields if missing
        reset({
          ...savedData,
          // Only restore string URLs (File objects are lost on page refresh)
          before_photos: beforePhotos,
          after_photos: afterPhotos,
          invoice_file_path:
            typeof savedData.invoice_file_path === "string"
              ? savedData.invoice_file_path
              : null,
          // Ensure address fields have defaults if missing
          address_street: savedData.address_street ?? "",
          address_area: savedData.address_area ?? "",
          address_city: savedData.address_city ?? "",
          address_state: savedData.address_state ?? "",
          address_pincode: savedData.address_pincode ?? "",
          // Ensure new fields have defaults if missing
          contact_person_name: savedData.contact_person_name ?? "",
          contact_person_designation:
            savedData.contact_person_designation ?? "",
          customer_dc_number: savedData.customer_dc_number ?? "",
          customer_dc_date: savedData.customer_dc_date ?? "",
          phone_numbers: savedData.phone_numbers ?? [],
          emails: savedData.emails ?? [],
          notes: savedData.notes ?? "",
        } as JobFormValues);
        hasRestoredRef.current = true;

        // Show appropriate message only when data was actually restored
        toast.info("Session restored", {
          description: hasRestoredPhotos
            ? "Your form data was restored. Note: Only uploaded photos are restored - any pending uploads need to be re-selected."
            : "Your previous form data has been restored.",
        });
      }
    }
  }, [job, reset]);

  // Reset form when job prop changes
  useEffect(() => {
    if (job) {
      reset({
        customer_name: job.customer_name,
        contact_person_name:
          (job as Job & { contact_person_name?: string }).contact_person_name ||
          "",
        contact_person_designation:
          (job as Job & { contact_person_designation?: string })
            .contact_person_designation || "",
        job_number: job.job_number,
        address_street:
          (job as Job & { address_street?: string }).address_street || "",
        address_area:
          (job as Job & { address_area?: string }).address_area || "",
        address_city:
          (job as Job & { address_city?: string }).address_city || "",
        address_state:
          (job as Job & { address_state?: string }).address_state || "",
        address_pincode:
          (job as Job & { address_pincode?: string }).address_pincode || "",
        contact_number: job.contact_number || "",
        email: job.email || "",
        material_type: job.material_type || "",
        booking_date: extractDate(job.booking_date),
        delivery_date: extractDate(job.delivery_date),
        special_requirements: job.special_requirements || "",
        notes: (job as Job & { notes?: string }).notes || "",
        invoice_file_path: job.invoice_file_path || "",
        before_photos: job.before_photos || [],
        after_photos: job.after_photos || [],
      });
      // Clear sessionStorage when editing an existing job
      clearFormData();
    }
  }, [job, reset]);

  // Save form data to sessionStorage on change (only for new jobs, debounced)
  useEffect(() => {
    if (!job && !isInitialMountRef.current) {
      // Don't save immediately after restore
      if (hasRestoredRef.current) {
        hasRestoredRef.current = false;
        return;
      }

      // Debounce saving to avoid too many writes
      const timeoutId = setTimeout(() => {
        const dataToSave: Partial<JobFormValues> = {
          customer_name: formValues.customer_name,
          job_number: formValues.job_number,
          address_street: formValues.address_street,
          address_area: formValues.address_area,
          address_city: formValues.address_city,
          address_state: formValues.address_state,
          address_pincode: formValues.address_pincode,
          contact_number: formValues.contact_number,
          phone_numbers: formValues.phone_numbers,
          email: formValues.email,
          emails: formValues.emails,
          contact_person_name: formValues.contact_person_name,
          contact_person_designation: formValues.contact_person_designation,
          customer_dc_number: formValues.customer_dc_number,
          customer_dc_date: formValues.customer_dc_date,
          material_type: formValues.material_type,
          booking_date: formValues.booking_date,
          delivery_date: formValues.delivery_date,
          special_requirements: formValues.special_requirements,
          notes: formValues.notes,
          invoice_file_path: formValues.invoice_file_path,
          before_photos: formValues.before_photos,
          after_photos: formValues.after_photos,
        };
        saveFormData(dataToSave);
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [formValues, job]);

  // Fetch and set auto-generated job number preview for new jobs
  useEffect(() => {
    if (!job && !autoGeneratedJobNumber && !isLoadingPreview) {
      setIsLoadingPreview(true);
      // Fetch preview of next job number (without incrementing)
      fetch("/api/jobs/settings/preview")
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch preview: ${res.statusText}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data.preview) {
            setAutoGeneratedJobNumber(data.preview);
            // Update form with preview number
            reset((prev) => ({
              ...prev,
              job_number: data.preview,
            }));
          } else {
            // If no preview available, show a placeholder
            console.warn("No job number preview available");
          }
        })
        .catch((error) => {
          console.error("Error fetching job number preview:", error);
          toast.error(
            "Failed to load job number preview. Please refresh the page.",
            {
              duration: 5000,
            }
          );
        })
        .finally(() => {
          setIsLoadingPreview(false);
        });
    }
  }, [job, autoGeneratedJobNumber, isLoadingPreview, reset]);

  // Handle customer selection and autofill
  const handleCustomerSelect = (customerName: string, customer?: Customer) => {
    if (customer) {
      setSelectedCustomer(customer);
      if (!originalCustomerData) {
        setOriginalCustomerData(customer);
      }

      // Autofill customer fields using setValue for smoother updates
      // This prevents the combobox from flickering
      setTimeout(() => {
        if (customer.contact_number)
          setValue("contact_number", customer.contact_number);
        if (customer.email) setValue("email", customer.email);
        if (customer.address_street)
          setValue("address_street", customer.address_street);
        if (customer.address_area)
          setValue("address_area", customer.address_area);
        if (customer.address_city)
          setValue("address_city", customer.address_city);
        if (customer.address_state)
          setValue("address_state", customer.address_state);
        if (customer.address_pincode)
          setValue("address_pincode", customer.address_pincode);
        if (customer.contact_person_name)
          setValue("contact_person_name", customer.contact_person_name);
      }, 0);
    } else {
      // New customer - just set the name
      setSelectedCustomer(null);
      setOriginalCustomerData(null);
    }
  };

  const handleFormSubmit = async (data: JobFormValues) => {
    setIsLoading(true);
    try {
      // Upload pending photos (File objects) to Supabase
      const { uploadFile } = await import("../utils/upload");

      const uploadPendingPhotos = async (
        photos: (string | File)[] | undefined
      ): Promise<string[]> => {
        if (!photos) return [];
        return Promise.all(
          photos.map(async (photo) => {
            if (photo instanceof File) {
              // Upload file to Supabase
              return await uploadFile(photo, {
                bucket: "job-photos",
                compress: true,
                maxSizeMB: 5,
              });
            }
            // Already uploaded URL
            return photo;
          })
        );
      };

      // Upload invoice if it's a File
      let invoiceFilePath: string | null = null;
      if (data.invoice_file_path instanceof File) {
        invoiceFilePath = await uploadFile(data.invoice_file_path, {
          bucket: "invoices",
          folder: "invoices",
          maxSizeMB: 5,
        });
      } else if (typeof data.invoice_file_path === "string") {
        invoiceFilePath = data.invoice_file_path || null;
      }

      const [beforePhotos, afterPhotos] = await Promise.all([
        uploadPendingPhotos(data.before_photos),
        uploadPendingPhotos(data.after_photos),
      ]);

      // Convert date strings to ISO datetime strings (with midnight time)
      const submitData = {
        ...data,
        before_photos: beforePhotos,
        after_photos: afterPhotos,
        invoice_file_path: invoiceFilePath || "",
        booking_date: data.booking_date
          ? new Date(`${data.booking_date}T00:00:00`).toISOString()
          : "",
        delivery_date: data.delivery_date
          ? new Date(`${data.delivery_date}T00:00:00`).toISOString()
          : undefined,
        customer_dc_date: data.customer_dc_date
          ? new Date(`${data.customer_dc_date}T00:00:00`).toISOString()
          : undefined,
      };

      // Check if customer data was changed and needs to be synced
      if (originalCustomerData && selectedCustomer && !job) {
        const customerDataChanged =
          originalCustomerData.email !== data.email ||
          originalCustomerData.contact_number !== data.contact_number ||
          originalCustomerData.address_street !== data.address_street ||
          originalCustomerData.address_area !== data.address_area ||
          originalCustomerData.address_city !== data.address_city ||
          originalCustomerData.address_state !== data.address_state ||
          originalCustomerData.address_pincode !== data.address_pincode;

        if (customerDataChanged) {
          // Update customer data across all jobs
          try {
            await fetch("/api/customers/update", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                old_customer_name: originalCustomerData.customer_name,
                old_email: originalCustomerData.email,
                old_contact_number: originalCustomerData.contact_number,
                customer_name: data.customer_name,
                email: data.email || null,
                contact_number: data.contact_number || null,
                address_street: data.address_street || null,
                address_area: data.address_area || null,
                address_city: data.address_city || null,
                address_state: data.address_state || null,
                address_pincode: data.address_pincode || null,
              }),
            });
          } catch (error) {
            console.error("Failed to update customer data:", error);
            // Continue with job creation even if customer update fails
          }
        }
      }

      await onSubmit(submitData as JobFormValues);
      // Clear sessionStorage on successful submit
      clearFormData();
    } catch (error) {
      console.error("Error in handleFormSubmit:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred while submitting the form"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Check if there's any meaningful data to lose
    const hasData = () => {
      const savedData = loadFormData();
      if (!savedData) return false;

      // Check if any field has a non-empty value
      const hasValue = (value: unknown): boolean => {
        if (value === null || value === undefined) return false;
        if (typeof value === "string") return value.trim().length > 0;
        if (typeof value === "number") return true;
        if (Array.isArray(value)) return value.length > 0;
        return Boolean(value);
      };

      return Object.values(savedData).some(hasValue);
    };

    // If there's saved data, show confirmation dialog
    if (hasData()) {
      setShowCancelDialog(true);
    } else {
      // No data to lose, just go back
      router.back();
    }
  };

  const handleConfirmCancel = () => {
    clearFormData();
    setShowCancelDialog(false);
    router.back();
  };

  const isFormDisabled = isLoading || isSubmitting || isFormSubmitting;

  const onFormSubmit = handleSubmit(
    async (data) => {
      console.log("Form validation passed, submitting with data:", data);
      await handleFormSubmit(data);
    },
    (errors) => {
      console.error("Form validation errors:", errors);
      const errorKeys = Object.keys(errors);
      if (errorKeys.length > 0) {
        console.error("Validation failed for fields:", errorKeys);
        const firstErrorKey = errorKeys[0] as keyof typeof errors;
        const firstError = errors[firstErrorKey];
        const errorMessage =
          firstError && "message" in firstError
            ? firstError.message
            : "Please fix the form errors before submitting";
        toast.error(errorMessage);
      } else {
        console.warn("Empty errors object - this shouldn't happen");
      }
    }
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        console.log("Form submit event triggered");
        onFormSubmit(e);
      }}
      className="space-y-6 md:space-y-8"
    >
      {/* Section 1: Job Information */}
      <div className="space-y-3 md:space-y-4">
        <div>
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-1">
            Job Information
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground">
            Auto-generated job number
          </p>
        </div>
        <FieldSet>
          <FieldGroup>
            <Field data-invalid={!!errors.job_number}>
              <FieldLabel htmlFor="job_number">
                Job Number <span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                id="job_number"
                {...register("job_number")}
                disabled={true}
                placeholder={isLoadingPreview ? "Loading..." : "Auto-generated"}
                readOnly
                className="bg-muted/50 cursor-not-allowed"
                aria-invalid={!!errors.job_number}
                title="Job number is automatically generated and cannot be changed"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Job numbers are automatically generated in financial year format
                (e.g., RPS-1/25-26). Numbers reset each April 1st.
              </p>
              <FieldError
                errors={
                  errors.job_number
                    ? [{ message: errors.job_number.message }]
                    : undefined
                }
              />
            </Field>
          </FieldGroup>
        </FieldSet>
      </div>

      <Separator className="my-4 md:my-6" />

      {/* Section 2: Company & Contact Details */}
      <div className="space-y-3 md:space-y-4">
        <div>
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-1">
            Company & Contact Details
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground">
            Company information and contact person details
          </p>
        </div>
        <FieldSet>
          <FieldGroup className="grid gap-4">
            <Field data-invalid={!!errors.customer_name}>
              <FieldLabel htmlFor="customer_name">
                Company Name <span className="text-red-500">*</span>
              </FieldLabel>
              {!job ? (
                <Controller
                  name="customer_name"
                  control={control}
                  render={({ field }) => (
                    <CustomerCombobox
                      id="customer_name"
                      value={field.value || ""}
                      onChange={(value, customer) => {
                        field.onChange(value);
                        handleCustomerSelect(value, customer);
                      }}
                      disabled={isFormDisabled}
                      aria-invalid={!!errors.customer_name}
                      placeholder="Search or type company name..."
                    />
                  )}
                />
              ) : (
                <Input
                  id="customer_name"
                  {...register("customer_name")}
                  disabled={isFormDisabled}
                  aria-invalid={!!errors.customer_name}
                  placeholder="Company name"
                />
              )}
              <FieldError
                errors={
                  errors.customer_name
                    ? [{ message: errors.customer_name.message }]
                    : undefined
                }
              />
            </Field>

            {/* Customer DC (Delivery Challan) Fields */}
            <FieldGroup className="grid gap-3 md:gap-4 md:grid-cols-2">
              <Field data-invalid={!!errors.customer_dc_number}>
                <FieldLabel htmlFor="customer_dc_number" className="text-sm">
                  Customer DC Number
                  <span className="text-xs font-normal text-muted-foreground ml-1.5">
                    (optional)
                  </span>
                </FieldLabel>
                <Input
                  id="customer_dc_number"
                  {...register("customer_dc_number")}
                  disabled={isFormDisabled}
                  aria-invalid={!!errors.customer_dc_number}
                  placeholder="Delivery Challan number"
                  className="text-sm sm:text-base"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the Delivery Challan number provided by the customer
                </p>
                <FieldError
                  errors={
                    errors.customer_dc_number
                      ? [{ message: errors.customer_dc_number.message }]
                      : undefined
                  }
                />
              </Field>

              <Field data-invalid={!!errors.customer_dc_date}>
                <FieldLabel htmlFor="customer_dc_date" className="text-sm">
                  DC Date
                  <span className="text-xs font-normal text-muted-foreground ml-1.5">
                    (optional)
                  </span>
                </FieldLabel>
                <Controller
                  name="customer_dc_date"
                  control={control}
                  render={({ field }) => (
                    <SimpleDatePicker
                      id="customer_dc_date"
                      value={field.value || ""}
                      onChange={(date) => field.onChange(date)}
                      disabled={isFormDisabled}
                      placeholder="Select DC date"
                      aria-invalid={!!errors.customer_dc_date}
                      className="text-sm sm:text-base"
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Date of the Delivery Challan
                </p>
                <FieldError
                  errors={
                    errors.customer_dc_date
                      ? [{ message: errors.customer_dc_date.message }]
                      : undefined
                  }
                />
              </Field>
            </FieldGroup>

            <FieldGroup className="grid gap-3 md:gap-4 md:grid-cols-2">
              <Field data-invalid={!!errors.contact_person_name}>
                <FieldLabel htmlFor="contact_person_name" className="text-sm">
                  Contact Person
                  <span className="text-xs font-normal text-muted-foreground ml-1.5">
                    (optional)
                  </span>
                </FieldLabel>
                <Input
                  id="contact_person_name"
                  {...register("contact_person_name")}
                  disabled={isFormDisabled}
                  aria-invalid={!!errors.contact_person_name}
                  placeholder="Contact person name"
                  className="text-sm sm:text-base"
                />
                <FieldError
                  errors={
                    errors.contact_person_name
                      ? [{ message: errors.contact_person_name.message }]
                      : undefined
                  }
                />
              </Field>

              <Field data-invalid={!!errors.contact_person_designation}>
                <FieldLabel
                  htmlFor="contact_person_designation"
                  className="text-sm"
                >
                  Designation
                  <span className="text-xs font-normal text-muted-foreground ml-1.5">
                    (optional)
                  </span>
                </FieldLabel>
                <Input
                  id="contact_person_designation"
                  {...register("contact_person_designation")}
                  disabled={isFormDisabled}
                  aria-invalid={!!errors.contact_person_designation}
                  placeholder="e.g., Manager, Director"
                  className="text-sm sm:text-base"
                />
                <FieldError
                  errors={
                    errors.contact_person_designation
                      ? [{ message: errors.contact_person_designation.message }]
                      : undefined
                  }
                />
              </Field>
            </FieldGroup>

            {/* Phone Numbers Section */}
            <Field
              data-invalid={!!errors.contact_number || !!errors.phone_numbers}
            >
              <FieldLabel htmlFor="contact_number">
                Phone Numbers (optional)
              </FieldLabel>
              <Controller
                name="contact_number"
                control={control}
                render={({ field: primaryField }) => (
                  <Controller
                    name="phone_numbers"
                    control={control}
                    render={({ field: additionalField }) => (
                      <MultiPhoneInput
                        primaryValue={primaryField.value || ""}
                        additionalValues={additionalField.value || []}
                        onPrimaryChange={(value) =>
                          primaryField.onChange(value)
                        }
                        onAdditionalChange={(values) => {
                          // Filter out empty strings
                          const filtered = values.filter(
                            (v) => v.trim() !== ""
                          );
                          additionalField.onChange(
                            filtered.length > 0 ? filtered : []
                          );
                        }}
                        disabled={isFormDisabled}
                        contactName={
                          watch("customer_name") || watch("contact_person_name")
                        }
                      />
                    )}
                  />
                )}
              />
              <FieldError
                errors={
                  errors.contact_number
                    ? [{ message: errors.contact_number.message }]
                    : errors.phone_numbers
                      ? [{ message: errors.phone_numbers.message }]
                      : undefined
                }
              />
            </Field>

            {/* Email Addresses Section */}
            <Field data-invalid={!!errors.email || !!errors.emails}>
              <FieldLabel htmlFor="email">
                Email Addresses (optional)
              </FieldLabel>
              <Controller
                name="email"
                control={control}
                render={({ field: primaryField }) => (
                  <Controller
                    name="emails"
                    control={control}
                    render={({ field: additionalField }) => (
                      <MultiEmailInput
                        primaryValue={primaryField.value || ""}
                        additionalValues={additionalField.value || []}
                        onPrimaryChange={(value) =>
                          primaryField.onChange(value)
                        }
                        onAdditionalChange={(values) => {
                          // Filter out empty strings
                          const filtered = values.filter(
                            (v) => v.trim() !== ""
                          );
                          additionalField.onChange(
                            filtered.length > 0 ? filtered : []
                          );
                        }}
                        disabled={isFormDisabled}
                        primaryError={errors.email?.message}
                      />
                    )}
                  />
                )}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Primary email is required for sending notifications
              </p>
              <FieldError
                errors={
                  errors.email
                    ? [{ message: errors.email.message }]
                    : errors.emails
                      ? [{ message: errors.emails.message }]
                      : undefined
                }
              />
            </Field>
          </FieldGroup>
        </FieldSet>
      </div>

      <Separator className="my-4 md:my-6" />

      {/* Section 3: Address */}
      <div className="space-y-3 md:space-y-4">
        <div>
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-1">
            Address
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground">
            Customer delivery address (optional)
          </p>
        </div>
        <FieldSet>
          <FieldGroup className="grid gap-3 md:gap-4">
            <Field data-invalid={!!errors.address_street}>
              <FieldLabel htmlFor="address_street">
                Street Address (optional)
              </FieldLabel>
              <Input
                id="address_street"
                {...register("address_street")}
                disabled={isFormDisabled}
                aria-invalid={!!errors.address_street}
                placeholder="No. 123, Main Street"
              />
              <FieldError
                errors={
                  errors.address_street
                    ? [{ message: errors.address_street.message }]
                    : undefined
                }
              />
            </Field>

            <Field data-invalid={!!errors.address_area}>
              <FieldLabel htmlFor="address_area">
                Area / Locality (optional)
              </FieldLabel>
              <Input
                id="address_area"
                {...register("address_area")}
                disabled={isFormDisabled}
                aria-invalid={!!errors.address_area}
                placeholder="Industrial Area, Sector 5"
              />
              <FieldError
                errors={
                  errors.address_area
                    ? [{ message: errors.address_area.message }]
                    : undefined
                }
              />
            </Field>

            <FieldGroup className="grid gap-3 md:gap-4 md:grid-cols-2">
              <Field data-invalid={!!errors.address_state}>
                <FieldLabel htmlFor="address_state">
                  State (optional)
                </FieldLabel>
                <Controller
                  name="address_state"
                  control={control}
                  render={({ field }) => (
                    <StateCombobox
                      id="address_state"
                      value={field.value || ""}
                      onChange={field.onChange}
                      disabled={isFormDisabled}
                      aria-invalid={!!errors.address_state}
                      placeholder="Select state..."
                    />
                  )}
                />
                <FieldError
                  errors={
                    errors.address_state
                      ? [{ message: errors.address_state.message }]
                      : undefined
                  }
                />
              </Field>

              <Field data-invalid={!!errors.address_city}>
                <FieldLabel htmlFor="address_city">City (optional)</FieldLabel>
                <Controller
                  name="address_city"
                  control={control}
                  render={({ field }) => (
                    <CityCombobox
                      id="address_city"
                      value={field.value || ""}
                      onChange={field.onChange}
                      disabled={isFormDisabled}
                      aria-invalid={!!errors.address_city}
                      placeholder="Select or type city..."
                      state={watch("address_state")}
                      allowCustom={true}
                    />
                  )}
                />
                <FieldError
                  errors={
                    errors.address_city
                      ? [{ message: errors.address_city.message }]
                      : undefined
                  }
                />
              </Field>
            </FieldGroup>

            <Field data-invalid={!!errors.address_pincode}>
              <FieldLabel htmlFor="address_pincode">
                Pincode (optional)
              </FieldLabel>
              <Input
                id="address_pincode"
                {...register("address_pincode")}
                disabled={isFormDisabled}
                aria-invalid={!!errors.address_pincode}
                placeholder="600001"
                maxLength={6}
              />
              <FieldError
                errors={
                  errors.address_pincode
                    ? [{ message: errors.address_pincode.message }]
                    : undefined
                }
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Enter 6-digit pincode
              </p>
            </Field>
          </FieldGroup>
        </FieldSet>
      </div>

      <Separator className="my-4 md:my-6" />

      {/* Section 4: Job Details */}
      <div className="space-y-3 md:space-y-4">
        <div>
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-1">
            Job Details
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground">
            Material type and scheduling information
          </p>
        </div>
        <FieldSet>
          <FieldGroup className="grid gap-3 md:gap-4 md:grid-cols-2">
            <Field data-invalid={!!errors.material_type}>
              <FieldLabel htmlFor="material_type">
                Material Type (optional)
              </FieldLabel>
              <Input
                id="material_type"
                {...register("material_type")}
                disabled={isFormDisabled}
                aria-invalid={!!errors.material_type}
                placeholder="e.g., Aluminum, Steel, Plastic"
              />
              <FieldError
                errors={
                  errors.material_type
                    ? [{ message: errors.material_type.message }]
                    : undefined
                }
              />
            </Field>

            <Field data-invalid={!!errors.booking_date}>
              <FieldLabel htmlFor="booking_date">
                Booking Date <span className="text-red-500">*</span>
              </FieldLabel>
              <Controller
                name="booking_date"
                control={control}
                render={({ field }) => (
                  <SimpleDatePicker
                    id="booking_date"
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isFormDisabled}
                    placeholder="Select booking date"
                    aria-invalid={!!errors.booking_date}
                  />
                )}
              />
              <FieldError
                errors={
                  errors.booking_date
                    ? [{ message: errors.booking_date.message }]
                    : undefined
                }
              />
              {!job && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Today&apos;s date:{" "}
                  {new Date().toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  (auto-set to today)
                </p>
              )}
            </Field>
          </FieldGroup>
        </FieldSet>

        <Field data-invalid={!!errors.delivery_date}>
          <FieldLabel htmlFor="delivery_date">
            Delivery Date (optional)
          </FieldLabel>
          <Controller
            name="delivery_date"
            control={control}
            render={({ field }) => (
              <SimpleDatePicker
                id="delivery_date"
                value={field.value || undefined}
                onChange={(date) => field.onChange(date || "")}
                disabled={isFormDisabled}
                placeholder="Select delivery date (optional)"
                aria-invalid={!!errors.delivery_date}
              />
            )}
          />
          <FieldError
            errors={
              errors.delivery_date
                ? [{ message: errors.delivery_date.message }]
                : undefined
            }
          />
        </Field>
      </div>

      <Separator className="my-4 md:my-6" />

      {/* Section 5: Additional Information */}
      <div className="space-y-3 md:space-y-4">
        <div>
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-foreground">
            Additional Information
          </h3>
        </div>
        <Field data-invalid={!!errors.special_requirements}>
          <FieldLabel htmlFor="special_requirements" className="text-sm">
            Special Requirements
            <span className="text-xs font-normal text-muted-foreground ml-1.5">
              (customer-visible)
            </span>
          </FieldLabel>
          <Textarea
            id="special_requirements"
            {...register("special_requirements")}
            disabled={isLoading || isSubmitting}
            rows={3}
            className="text-sm sm:text-base"
            aria-invalid={!!errors.special_requirements}
            placeholder="Any special instructions or requirements..."
          />
          <FieldError
            errors={
              errors.special_requirements
                ? [{ message: errors.special_requirements.message }]
                : undefined
            }
          />
        </Field>

        <Field data-invalid={!!errors.notes}>
          <FieldLabel htmlFor="notes" className="text-sm">
            Internal Notes
            <span className="text-xs font-normal text-muted-foreground ml-1.5">
              (internal use only)
            </span>
          </FieldLabel>
          <Textarea
            id="notes"
            {...register("notes")}
            disabled={isLoading || isSubmitting}
            rows={4}
            className="text-sm sm:text-base"
            aria-invalid={!!errors.notes}
            placeholder="Internal notes and observations..."
          />
          <FieldError
            errors={
              errors.notes ? [{ message: errors.notes.message }] : undefined
            }
          />
        </Field>
      </div>

      <Separator className="my-4 md:my-6" />

      {/* Section 6: Photos */}
      <div className="space-y-3 md:space-y-4">
        <div>
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-1">
            Photos
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground">
            Upload photos related to the job
          </p>
        </div>

        {/* Before Photos */}
        <Field data-invalid={!!errors.before_photos}>
          <Controller
            name="before_photos"
            control={control}
            render={({ field }) => (
              <>
                <MediaUpload
                  media={field.value || []}
                  onMediaChange={field.onChange}
                  label="Before Photos & Videos"
                  required={!job}
                  disabled={isFormDisabled}
                  maxFiles={10}
                  allowImages={true}
                  allowVideos={true}
                  bucket="job-photos"
                />
                <FieldError
                  errors={
                    errors.before_photos
                      ? [{ message: errors.before_photos.message }]
                      : undefined
                  }
                />
              </>
            )}
          />
        </Field>

        {/* After Photos - Only show if job exists (for editing) */}
        {job && (
          <Field data-invalid={!!errors.after_photos}>
            <Controller
              name="after_photos"
              control={control}
              render={({ field }) => (
                <>
                  <MediaUpload
                    media={field.value || []}
                    onMediaChange={field.onChange}
                    label="After Photos & Videos (optional)"
                    disabled={isFormDisabled}
                    maxFiles={10}
                    allowImages={true}
                    allowVideos={true}
                    bucket="job-photos"
                  />
                  <FieldError
                    errors={
                      errors.after_photos
                        ? [{ message: errors.after_photos.message }]
                        : undefined
                    }
                  />
                </>
              )}
            />
          </Field>
        )}
      </div>

      {/* Invoice Upload - Available when status is in_progress or completed */}
      {(job?.status === "in_progress" || job?.status === "completed") && (
        <>
          <Separator className="my-4 md:my-6" />
          <div className="space-y-3 md:space-y-4">
            <div>
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-1">
                Invoice
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Upload invoice document for this job
              </p>
            </div>
            <Field data-invalid={!!errors.invoice_file_path}>
              <Controller
                name="invoice_file_path"
                control={control}
                render={({ field }) => (
                  <>
                    <InvoiceUpload
                      invoiceFile={field.value || null}
                      onInvoiceChange={field.onChange}
                      disabled={isFormDisabled}
                    />
                    <FieldError
                      errors={
                        errors.invoice_file_path
                          ? [{ message: errors.invoice_file_path.message }]
                          : undefined
                      }
                    />
                  </>
                )}
              />
            </Field>
          </div>
        </>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
        <Button
          type="submit"
          disabled={isFormDisabled}
          className="w-full sm:w-auto order-2 sm:order-1"
          size="lg"
        >
          {isFormDisabled ? "Saving..." : job ? "Update Job" : "Create Job"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isFormDisabled}
          className="w-full sm:w-auto order-1 sm:order-2"
          size="lg"
        >
          Cancel
        </Button>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved form data. If you cancel, this data will be lost.
              Note: Form data is only saved during your current session and will
              be cleared when you close the browser or app.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCancelDialog(false)}>
              Keep Editing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
