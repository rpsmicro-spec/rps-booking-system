"use client";

import dynamic from "next/dynamic";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, FileText } from "lucide-react";

// Dynamically import the internal PDF viewer with SSR disabled
// This prevents DOMMatrix and other browser-only APIs from being evaluated during SSR
const PDFViewerInternal = dynamic(
  () =>
    import("./PDFViewer.internal").then((mod) => ({
      default: mod.PDFViewerInternal,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8 min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <FileText className="h-8 w-8 animate-pulse text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading PDF viewer...</p>
        </div>
      </div>
    ),
  }
);

interface PDFViewerProps {
  /**
   * URL of the PDF file to display
   */
  url: string | null;
  /**
   * Title for the PDF viewer
   */
  title?: string;
  /**
   * Whether to show download button
   */
  showDownload?: boolean;
  /**
   * Custom height for the viewer (default: 600px)
   */
  height?: string;
  /**
   * Additional className for the container
   */
  className?: string;
}

/**
 * PDF Viewer Component using react-pdf (PDF.js)
 *
 * Displays PDF files with proper rendering, page navigation, and zoom controls.
 * Falls back to iframe if react-pdf fails to load.
 *
 * This component uses dynamic imports to ensure react-pdf is only loaded on the client side,
 * preventing SSR errors with browser-only APIs like DOMMatrix.
 */
export function PDFViewer({
  url,
  title = "PDF Document",
  showDownload = true,
  height = "600px",
  className = "",
}: PDFViewerProps) {
  if (!url) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No PDF file available.</AlertDescription>
      </Alert>
    );
  }

  return (
    <PDFViewerInternal
      url={url}
      title={title}
      showDownload={showDownload}
      height={height}
      className={className}
    />
  );
}
