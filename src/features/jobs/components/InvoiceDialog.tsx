"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PDFViewer } from "@/components/pdf/PDFViewer";

interface InvoiceDialogProps {
  invoiceUrl: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceDialog({ invoiceUrl, open, onOpenChange }: InvoiceDialogProps) {
  if (!invoiceUrl) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice</DialogTitle>
        </DialogHeader>
        <div className="pt-4">
          <PDFViewer
            url={invoiceUrl}
            title="Invoice PDF"
            showDownload={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

