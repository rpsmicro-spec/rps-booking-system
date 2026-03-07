"use client";

import { useEffect } from "react";
import { FieldLabel } from "@/components/ui/field";
import { X, FileText } from "lucide-react";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/dropzone";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";

interface InvoiceUploadProps {
  invoiceFile: File | string | null;
  onInvoiceChange: (file: File | string | null) => void;
  disabled?: boolean;
  /** When "minimal", no label above dropzone and dropzone shows only drag/select; parent shows limit */
  emptyStateVariant?: "default" | "minimal";
}

export function InvoiceUpload({
  invoiceFile,
  onInvoiceChange,
  disabled = false,
  emptyStateVariant = "default",
}: InvoiceUploadProps) {
  const uploadHook = useSupabaseUpload({
    bucketName: "invoices",
    allowedMimeTypes: ["application/pdf"],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
  });

  // Handle file selection - store file (not upload yet)
  useEffect(() => {
    if (uploadHook.files.length > 0) {
      // Store file (will be uploaded on form submit)
      onInvoiceChange(uploadHook.files[0]);
      uploadHook.setFiles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadHook.files.length]);

  const handleRemove = () => {
    onInvoiceChange(null);
    uploadHook.setFiles([]);
  };

  if (disabled) {
    return (
      <div className="space-y-2">
        {emptyStateVariant !== "minimal" && (
          <FieldLabel>Invoice File (PDF, max 5MB)</FieldLabel>
        )}
        {invoiceFile && (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {invoiceFile instanceof File
                ? "Invoice selected (pending upload)"
                : "Invoice uploaded"}
            </span>
            {typeof invoiceFile === "string" && (
              <a
                href={invoiceFile}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                View invoice
              </a>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {emptyStateVariant !== "minimal" && (
        <FieldLabel>Invoice File (PDF, max 5MB)</FieldLabel>
      )}

      {invoiceFile ? (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {invoiceFile instanceof File
                ? "Invoice selected (pending upload)"
                : "Invoice uploaded"}
            </span>
            {typeof invoiceFile === "string" && (
              <a
                href={invoiceFile}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                View invoice
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <Dropzone {...uploadHook} emptyStateVariant={emptyStateVariant}>
          <DropzoneEmptyState />
          <DropzoneContent />
        </Dropzone>
      )}
    </div>
  );
}
