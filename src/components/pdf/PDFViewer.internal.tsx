"use client";

import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  FileText,
  Download,
  ExternalLink,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker
// Note: If worker fails to load, component automatically falls back to iframe viewer
// The worker is optional - if it fails, the iframe fallback provides full PDF viewing functionality
if (typeof window !== "undefined") {
  // Try unpkg CDN first (supports .mjs files)
  // If this fails, the component will automatically use iframe fallback
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface PDFViewerInternalProps {
  /**
   * URL of the PDF file to display
   */
  url: string;
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
 * Internal PDF Viewer Component using react-pdf (PDF.js)
 *
 * This component should only be loaded on the client side.
 * It's wrapped by PDFViewer which handles dynamic imports.
 */
export function PDFViewerInternal({
  url,
  title = "PDF Document",
  showDownload = true,
  height = "600px",
  className = "",
}: PDFViewerInternalProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [useIframe, setUseIframe] = useState(false);
  const [workerError, setWorkerError] = useState(false);

  // Check if worker fails to load and fallback to iframe
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Listen for worker errors
      const handleWorkerError = (event: ErrorEvent) => {
        if (
          event.message?.includes("pdf.worker") ||
          event.message?.includes("Failed to fetch dynamically imported module")
        ) {
          setWorkerError(true);
          setUseIframe(true);
        }
      };

      window.addEventListener("error", handleWorkerError);
      return () => window.removeEventListener("error", handleWorkerError);
    }
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setHasError(false);
  };

  const onDocumentLoadError = (error: Error) => {
    // Check if it's a worker error
    const errorMessage = error?.message || error?.toString() || "";
    if (
      errorMessage.includes("worker") ||
      errorMessage.includes("pdf.worker")
    ) {
      setWorkerError(true);
    }
    setIsLoading(false);
    setHasError(true);
    // Fallback to iframe if react-pdf fails
    setUseIframe(true);
  };

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => (numPages ? Math.min(numPages, prev + 1) : prev));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(3.0, prev + 0.25));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(0.5, prev - 0.25));
  };

  // Fallback to iframe if react-pdf fails, worker fails, or is disabled
  if (useIframe || hasError || workerError) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="relative border rounded-lg overflow-hidden bg-muted/50">
          <iframe
            src={`${url}#toolbar=1&navpanes=1&scrollbar=1`}
            title={title}
            className="w-full border-0"
            style={{ height }}
            onLoad={() => setIsLoading(false)}
          />
        </div>
        <div className="flex items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
          {showDownload && (
            <Button variant="outline" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer" download>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </a>
            </Button>
          )}
          <Button variant="outline" size="icon" asChild title="Open in New Tab">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* PDF Viewer */}
      <div className="relative border rounded-lg overflow-hidden bg-muted/50">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="flex flex-col items-center gap-2">
              <FileText className="h-8 w-8 animate-pulse text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading PDF...</p>
            </div>
          </div>
        )}

        <div className="overflow-auto" style={{ height, maxHeight: height }}>
          <div className="flex justify-center p-4">
            <Document
              file={url}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center p-8">
                  <FileText className="h-8 w-8 animate-pulse text-muted-foreground" />
                </div>
              }
              error={
                <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
                  <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Unable to display PDF
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    Failed to load PDF. Falling back to browser viewer.
                  </p>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-lg"
              />
            </Document>
          </div>
        </div>
      </div>

      {/* Controls */}
      {numPages && (
        <div className="flex items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              Page {pageNumber} of {numPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={zoomOut}
              disabled={scale <= 0.5}
            >
              <span className="text-sm">-</span>
            </Button>
            <span className="text-sm font-medium w-16 text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={zoomIn}
              disabled={scale >= 3.0}
            >
              <span className="text-sm">+</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              asChild
              title="Open in New Tab"
            >
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {showDownload && (
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer" download>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
