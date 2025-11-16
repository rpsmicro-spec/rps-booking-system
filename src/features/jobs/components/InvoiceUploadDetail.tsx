"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceUpload } from "./InvoiceUpload";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Loader2, FileText, X } from "lucide-react";
import { uploadFile } from "../utils/upload";
import type { Job } from "@/types/types";
import { JOB_STATUS } from "@/lib/constants";
import { PDFViewer } from "@/components/pdf/PDFViewer";
import { Separator } from "@/components/ui/separator";

interface InvoiceUploadDetailProps {
  job: Job; // Original job with path
  displayJob?: Job; // Job with signed URL for display
  onUpdate?: () => void;
}

export function InvoiceUploadDetail({ job, displayJob, onUpdate }: InvoiceUploadDetailProps) {
  // Note: job.invoice_file_path is the path (e.g., "invoices/invoices/xxx.pdf")
  // We track if there's an existing invoice (path exists) vs a new file to upload
  const [hasExistingInvoice, setHasExistingInvoice] = useState(
    !!job.invoice_file_path
  );
  const [invoiceFile, setInvoiceFile] = useState<File | string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Update invoice state when job changes
  useEffect(() => {
    const hasInvoice = !!job.invoice_file_path;
    setHasExistingInvoice(hasInvoice);
    // Don't set invoiceFile to the path - we'll use hasExistingInvoice to show status
  }, [job.invoice_file_path]);

  // Create preview URL when file is selected
  useEffect(() => {
    if (pendingFile instanceof File) {
      const url = URL.createObjectURL(pendingFile);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [pendingFile]);

  // Show component only when status is in_progress or completed
  if (job.status !== JOB_STATUS.IN_PROGRESS && job.status !== JOB_STATUS.COMPLETED) {
    return null;
  }

  const handleInvoiceChange = (file: File | string | null) => {
    if (file instanceof File) {
      // New file selected - mark as pending
      setInvoiceFile(file);
      setPendingFile(file);
    } else if (file === null) {
      // Invoice removed - save immediately if there was an existing invoice
      if (hasExistingInvoice) {
        setHasExistingInvoice(false);
        setInvoiceFile(null);
        setPendingFile(null);
        handleSaveInvoice(null);
      } else {
        // Just clear pending file
        setInvoiceFile(null);
        setPendingFile(null);
      }
    } else {
      // String (shouldn't happen in this component)
      setInvoiceFile(file);
      setPendingFile(null);
    }
  };

  const handleSaveInvoice = async (file: File | null) => {
    setIsUploading(true);
    try {
      let invoiceFilePath: string | null = null;

      if (file instanceof File) {
        // Upload new file
        invoiceFilePath = await uploadFile(file, {
          bucket: "invoices",
          folder: "invoices",
          maxSizeMB: 5,
        });
      } else if (file === null) {
        // Remove invoice - set to empty string
        invoiceFilePath = null;
      } else {
        // No change
        return;
      }

      // Update job via API
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_file_path: invoiceFilePath || "",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update job");
      }

      toast.success(
        file === null
          ? "Invoice removed successfully"
          : "Invoice uploaded successfully"
      );
      setPendingFile(null);
      setHasExistingInvoice(file !== null);
      setInvoiceFile(null); // Clear after successful upload
      setPreviewUrl(null); // Clear preview URL
      onUpdate?.();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to upload invoice. Please try again."
      );
      // Reset state on error
      setHasExistingInvoice(!!job.invoice_file_path);
      setInvoiceFile(null);
      setPendingFile(null);
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!pendingFile) {
      toast.info("No invoice to upload");
      return;
    }
    await handleSaveInvoice(pendingFile);
  };

  const hasPendingUpload = pendingFile !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasExistingInvoice && !hasPendingUpload && (
          <>
            {displayJob?.invoice_file_path && (
              <>
                <PDFViewer
                  url={displayJob.invoice_file_path}
                  title="Invoice PDF"
                  showDownload={true}
                />
                <Separator />
              </>
            )}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Invoice uploaded</p>
                  <p className="text-xs text-muted-foreground">
                    You can replace it with a new file below
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleInvoiceChange(null)}
                disabled={isUploading}
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          </>
        )}

        <InvoiceUpload
          invoiceFile={invoiceFile}
          onInvoiceChange={handleInvoiceChange}
          disabled={isUploading}
        />

        {hasPendingUpload && previewUrl && (
          <>
            <Separator />
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Preview Invoice</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Review the invoice below, then click Upload to confirm
                </p>
                <div className="border rounded-lg overflow-hidden">
                  <PDFViewer
                    url={previewUrl}
                    title="Invoice Preview"
                    showDownload={false}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  Ready to upload
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPendingFile(null);
                      setInvoiceFile(null);
                      setPreviewUrl(null);
                    }}
                    disabled={isUploading}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isUploading}
                    size="sm"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Invoice
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

