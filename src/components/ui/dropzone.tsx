"use client";

import { cn } from "@/lib/utils";
import { type UseSupabaseUploadReturn } from "@/hooks/use-supabase-upload";
import { Button } from "@/components/ui/button";
import { CheckCircle, File, Loader2, Upload, X, Camera } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useRef,
} from "react";

export const formatBytes = (
  bytes: number,
  decimals = 2,
  size?: "bytes" | "KB" | "MB" | "GB" | "TB" | "PB" | "EB" | "ZB" | "YB"
) => {
  const k = 1000;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  if (bytes === 0 || bytes === undefined)
    return size !== undefined ? `0 ${size}` : "0 bytes";
  const i =
    size !== undefined
      ? sizes.indexOf(size)
      : Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

type DropzoneContextType = Omit<
  UseSupabaseUploadReturn,
  "getRootProps" | "getInputProps"
> & {
  enableCamera?: boolean;
  cameraInputRef?: React.RefObject<HTMLInputElement | null>;
  handleCameraClick?: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
};

const DropzoneContext = createContext<DropzoneContextType | undefined>(
  undefined
);

type DropzoneProps = UseSupabaseUploadReturn & {
  className?: string;
  /**
   * Enable camera capture on mobile devices
   * When true, adds a camera button and supports camera input
   */
  enableCamera?: boolean;
};

const Dropzone = ({
  className,
  children,
  getRootProps,
  getInputProps,
  enableCamera = false,
  ...restProps
}: PropsWithChildren<DropzoneProps>) => {
  const isSuccess = restProps.isSuccess;
  const isActive = restProps.isDragActive;
  const isInvalid =
    (restProps.isDragActive && restProps.isDragReject) ||
    (restProps.errors.length > 0 && !restProps.isSuccess) ||
    restProps.files.some((file) => file.errors.length !== 0);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mainInputRef = useRef<HTMLInputElement | null>(null);

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  // Callback ref to capture the main input element
  const setMainInputRef = (element: HTMLInputElement | null) => {
    mainInputRef.current = element;
  };

  return (
    <DropzoneContext.Provider
      value={{
        ...restProps,
        enableCamera,
        cameraInputRef,
        handleCameraClick,
        inputRef: mainInputRef as React.RefObject<HTMLInputElement>,
      }}
    >
      <div
        {...getRootProps({
          className: cn(
            "border-2 rounded-lg p-6 text-center bg-card transition-colors duration-300 text-foreground",
            "border-input", // Match input border color
            className,
            isSuccess ? "border-solid" : "border-dashed",
            isActive && "border-ring bg-primary/15 dark:bg-primary/10", // Use ring color for active state
            isInvalid && "border-destructive bg-destructive/10"
          ),
        })}
      >
        <input {...getInputProps()} ref={setMainInputRef} />
        {/* Separate camera input for mobile */}
        {enableCamera && (
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) {
                // Create a synthetic drop event to trigger the dropzone's onDrop
                const fileArray = Array.from(files);
                // Access the onDrop from the dropzone's internal state
                // We'll trigger it by setting files on the main input and dispatching change
                if (mainInputRef.current) {
                  const dataTransfer = new DataTransfer();
                  fileArray.forEach((file) => dataTransfer.items.add(file));
                  mainInputRef.current.files = dataTransfer.files;
                  mainInputRef.current.dispatchEvent(
                    new Event("change", { bubbles: true })
                  );
                }
                // Reset the camera input so the same file can be selected again
                e.target.value = "";
              }
            }}
          />
        )}
        {children}
      </div>
    </DropzoneContext.Provider>
  );
};
const DropzoneContent = ({ className }: { className?: string }) => {
  const {
    files,
    setFiles,
    onUpload,
    loading,
    successes,
    errors,
    maxFiles,
    isSuccess,
  } = useDropzoneContext();

  const exceedMaxFiles = files.length > maxFiles;
  const hasFilesToReview = files.length > 0 && !isSuccess;
  const hasFilesToUpload = files.some(
    (file) => !successes.includes(file.name) && file.errors.length === 0
  );

  const handleRemoveFile = useCallback(
    (fileName: string) => {
      setFiles(files.filter((file) => file.name !== fileName));
    },
    [files, setFiles]
  );

  if (isSuccess) {
    return (
      <div
        className={cn(
          "flex flex-row items-center gap-x-2 justify-center",
          className
        )}
      >
        <CheckCircle size={16} className="text-primary" />
        <p className="text-primary text-sm">
          Successfully uploaded {files.length} file{files.length > 1 ? "s" : ""}
        </p>
      </div>
    );
  }

  if (!hasFilesToReview) {
    return null;
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Review Section Header */}
      <div className="mb-3 mt-4">
        <p className="text-sm font-medium">Review files before uploading</p>
        <p className="text-xs text-muted-foreground">
          {files.length} file{files.length > 1 ? "s" : ""} selected
        </p>
      </div>

      {/* Files Grid - Review Mode */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
        {files.map((file, idx) => {
          const fileError = errors.find((e) => e.name === file.name);
          const isSuccessfullyUploaded = !!successes.find(
            (e) => e === file.name
          );
          const isUploading = loading && !isSuccessfullyUploaded;

          return (
            <div
              key={`${file.name}-${idx}`}
              className="relative group border rounded-lg overflow-hidden bg-card"
            >
              {/* Preview Thumbnail */}
              {file.type.startsWith("image/") ? (
                <div className="aspect-square relative bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-muted flex items-center justify-center">
                  <File size={24} className="text-muted-foreground" />
                </div>
              )}

              {/* Overlay States */}
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}

              {isSuccessfullyUploaded && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
              )}

              {fileError && (
                <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                  <X className="h-6 w-6 text-destructive" />
                </div>
              )}

              {/* File Info */}
              <div className="p-2 space-y-1">
                <p title={file.name} className="text-xs font-medium truncate">
                  {file.name}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size, 2)}
                  </p>
                  {fileError && (
                    <p className="text-xs text-destructive truncate max-w-[100px]">
                      Error
                    </p>
                  )}
                </div>
              </div>

              {/* Remove Button */}
              {!isUploading && !isSuccessfullyUploaded && (
                <button
                  type="button"
                  onClick={() => handleRemoveFile(file.name)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600 active:bg-red-700 touch-manipulation"
                  aria-label="Remove file"
                >
                  <X className="h-3 w-3" />
                </button>
              )}

              {/* Error Message */}
              {fileError && (
                <div className="p-2 bg-destructive/10 border-t">
                  <p className="text-xs text-destructive line-clamp-2">
                    {fileError.message}
                  </p>
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50">
                  <Progress value={undefined} className="h-1" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error Messages */}
      {exceedMaxFiles && (
        <div className="mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">
            You may upload only up to {maxFiles} files, please remove{" "}
            {files.length - maxFiles} file
            {files.length - maxFiles > 1 ? "s" : ""}.
          </p>
        </div>
      )}

      {files.some((file) => file.errors.length > 0) && !exceedMaxFiles && (
        <div className="mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">
            Some files have errors. Please remove them before uploading.
          </p>
        </div>
      )}

      {/* Upload Button */}
      {hasFilesToUpload && !exceedMaxFiles && (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setFiles([])}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={onUpload}
            disabled={files.some((file) => file.errors.length !== 0) || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload {files.length} file{files.length > 1 ? "s" : ""}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

const DropzoneEmptyState = ({ className }: { className?: string }) => {
  const {
    maxFiles,
    maxFileSize,
    inputRef,
    isSuccess,
    enableCamera,
    handleCameraClick,
  } = useDropzoneContext();

  if (isSuccess) {
    return null;
  }

  return (
    <div className={cn("flex flex-col items-center gap-y-2", className)}>
      <Upload size={20} className="text-muted-foreground" />
      <p className="text-sm">
        Upload{maxFiles > 1 ? ` ${maxFiles}` : ""} file
        {maxFiles !== 1 ? "s" : ""}
      </p>
      <div className="flex flex-col items-center gap-y-1">
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <p className="text-xs text-muted-foreground">
            Drag and drop or{" "}
            <a
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                inputRef?.current?.click();
              }}
              className="underline cursor-pointer transition hover:text-foreground"
            >
              select {maxFiles === 1 ? `file` : "files"}
            </a>
          </p>
          {enableCamera && (
            <>
              <span className="text-xs text-muted-foreground">or</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCameraClick?.();
                }}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground underline cursor-pointer transition hover:text-foreground"
              >
                <Camera className="h-3 w-3" />
                open camera
              </button>
            </>
          )}
        </div>
        {maxFileSize !== Number.POSITIVE_INFINITY && (
          <p className="text-xs text-muted-foreground">
            Maximum file size: {formatBytes(maxFileSize, 2)}
          </p>
        )}
      </div>
    </div>
  );
};

const useDropzoneContext = () => {
  const context = useContext(DropzoneContext);

  if (!context) {
    throw new Error("useDropzoneContext must be used within a Dropzone");
  }

  return context;
};

export { Dropzone, DropzoneContent, DropzoneEmptyState, useDropzoneContext };
