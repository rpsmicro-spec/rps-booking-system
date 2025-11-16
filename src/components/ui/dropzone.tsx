"use client";

import { cn } from "@/lib/utils";
import { type UseSupabaseUploadReturn } from "@/hooks/use-supabase-upload";
import { Button } from "@/components/ui/button";
import { CheckCircle, File, Loader2, Upload, X } from "lucide-react";
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
    maxFileSize,
    maxFiles,
    isSuccess,
  } = useDropzoneContext();

  const exceedMaxFiles = files.length > maxFiles;

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

  return (
    <div className={cn("flex flex-col", className)}>
      {files.map((file, idx) => {
        const fileError = errors.find((e) => e.name === file.name);
        const isSuccessfullyUploaded = !!successes.find((e) => e === file.name);

        return (
          <div
            key={`${file.name}-${idx}`}
            className="flex items-center gap-x-4 border-b py-2 first:mt-4 last:mb-4 "
          >
            {file.type.startsWith("image/") ? (
              <div className="h-10 w-10 rounded border overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={file.preview}
                  alt={file.name}
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center">
                <File size={18} />
              </div>
            )}

            <div className="shrink grow flex flex-col items-start truncate gap-1 w-full min-w-0">
              <p title={file.name} className="text-sm truncate max-w-full">
                {file.name}
              </p>
              {file.errors.length > 0 ? (
                <>
                  <p className="text-xs text-destructive">
                    {file.errors
                      .map((e) =>
                        e.message.startsWith("File is larger than")
                          ? `File is larger than ${formatBytes(
                              maxFileSize,
                              2
                            )} (Size: ${formatBytes(file.size, 2)})`
                          : e.message
                      )
                      .join(", ")}
                  </p>
                  <Progress value={0} className="h-1.5" />
                </>
              ) : loading && !isSuccessfullyUploaded ? (
                <>
                  <div className="flex items-center gap-2 w-full">
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Uploading...
                    </p>
                  </div>
                  <Progress value={undefined} className="h-1.5" />
                </>
              ) : !!fileError ? (
                <>
                  <p className="text-xs text-destructive">
                    Failed to upload: {fileError.message}
                  </p>
                  <Progress value={0} className="h-1.5" />
                </>
              ) : isSuccessfullyUploaded ? (
                <>
                  <div className="flex items-center gap-2 w-full">
                    <CheckCircle className="h-3 w-3 text-primary" />
                    <p className="text-xs text-primary">
                      Successfully uploaded
                    </p>
                  </div>
                  <Progress value={100} className="h-1.5" />
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size, 2)} • Ready to upload
                  </p>
                  <Progress value={0} className="h-1.5" />
                </>
              )}
            </div>

            {!loading && !isSuccessfullyUploaded && (
              <Button
                size="icon"
                variant="link"
                className="shrink-0 justify-self-end text-muted-foreground hover:text-foreground"
                onClick={() => handleRemoveFile(file.name)}
              >
                <X />
              </Button>
            )}
          </div>
        );
      })}
      {exceedMaxFiles && (
        <p className="text-sm text-left mt-2 text-destructive">
          You may upload only up to {maxFiles} files, please remove{" "}
          {files.length - maxFiles} file
          {files.length - maxFiles > 1 ? "s" : ""}.
        </p>
      )}
      {files.length > 0 && !exceedMaxFiles && (
        <div className="mt-2">
          <Button
            variant="outline"
            onClick={onUpload}
            disabled={files.some((file) => file.errors.length !== 0) || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>Upload files</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

const DropzoneEmptyState = ({ className }: { className?: string }) => {
  const { maxFiles, maxFileSize, inputRef, isSuccess } = useDropzoneContext();

  if (isSuccess) {
    return null;
  }

  return (
    <div className={cn("flex flex-col items-center gap-y-2", className)}>
      <Upload size={20} className="text-muted-foreground" />
      <p className="text-sm">
        Upload{!!maxFiles && maxFiles > 1 ? ` ${maxFiles}` : ""} file
        {!maxFiles || maxFiles > 1 ? "s" : ""}
      </p>
      <div className="flex flex-col items-center gap-y-1">
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
          </a>{" "}
          to upload
        </p>
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
