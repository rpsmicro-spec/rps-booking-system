"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { FieldLabel } from "@/components/ui/field";
import { X, Play, Image as ImageIcon, Film } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/dropzone";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";
import { getThumbnailUrl } from "../utils/image-url";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Type for media - can be File (pending upload) or string (already uploaded URL)
type MediaItem = File | string;

interface MediaUploadProps {
  media: MediaItem[];
  onMediaChange: (media: MediaItem[]) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  maxFiles?: number;
  bucket?: "job-photos" | "invoices" | "temp-uploads";
  allowImages?: boolean;
  allowVideos?: boolean;
}

// Helper to check if a file or URL is a video
function isVideo(item: MediaItem): boolean {
  if (item instanceof File) {
    return item.type.startsWith("video/");
  }
  if (typeof item === "string") {
    const videoExtensions = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v"];
    return videoExtensions.some((ext) =>
      item.toLowerCase().includes(ext.toLowerCase())
    );
  }
  return false;
}

export function MediaUpload({
  media,
  onMediaChange,
  label = "Photos & Videos",
  required = false,
  disabled = false,
  maxFiles = 10,
  bucket = "job-photos",
  allowImages = true,
  allowVideos = true,
}: MediaUploadProps) {
  const objectUrlRefs = useRef<Map<number, string>>(new Map());
  const onMediaChangeRef = useRef(onMediaChange);
  const mediaRef = useRef(media);
  const [previewMedia, setPreviewMedia] = useState<{
    url: string;
    type: "image" | "video";
  } | null>(null);

  // Keep refs in sync
  useEffect(() => {
    onMediaChangeRef.current = onMediaChange;
    mediaRef.current = media;
  }, [onMediaChange, media]);

  // Build allowed MIME types
  const allowedMimeTypes: string[] = [];
  if (allowImages) {
    allowedMimeTypes.push(
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif"
    );
  }
  if (allowVideos) {
    allowedMimeTypes.push(
      "video/mp4",
      "video/webm",
      "video/quicktime", // .mov
      "video/x-msvideo", // .avi
      "video/x-matroska" // .mkv
    );
  }

  const uploadHook = useSupabaseUpload({
    bucketName: bucket,
    allowedMimeTypes,
    maxFileSize: allowVideos ? 25 * 1024 * 1024 : 5 * 1024 * 1024, // 25MB for videos, 5MB for images only
    maxFiles: maxFiles - media.length,
  });

  // Handle file selection - add files to media array (not upload yet)
  useEffect(() => {
    const files = uploadHook.files;
    if (files.length > 0) {
      const currentMedia = mediaRef.current;
      // Check max files limit
      if (currentMedia.length + files.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        uploadHook.setFiles([]);
        return;
      }

      // Add files to media array (they'll be uploaded on form submit)
      onMediaChangeRef.current([...currentMedia, ...files]);
      uploadHook.setFiles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadHook.files.length, maxFiles]);

  // Clean up object URLs when media are removed
  const handleRemoveMedia = (index: number) => {
    const item = media[index];
    // If it's a File, clean up its object URL
    if (item instanceof File) {
      const objectUrl = objectUrlRefs.current.get(index);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrlRefs.current.delete(index);
      }
    }
    const newMedia = media.filter((_, i) => i !== index);
    onMediaChange(newMedia);
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    const urls = objectUrlRefs.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  // Create object URLs for all File media
  const mediaUrls = useMemo(() => {
    // Clean up old object URLs that are no longer needed
    const currentIndices = new Set(media.map((_, idx) => idx));
    objectUrlRefs.current.forEach((url, idx) => {
      if (!currentIndices.has(idx)) {
        URL.revokeObjectURL(url);
        objectUrlRefs.current.delete(idx);
      }
    });

    return media.map((item, index) => {
      if (item instanceof File) {
        // Create object URL for File preview
        if (!objectUrlRefs.current.has(index)) {
          const url = URL.createObjectURL(item);
          objectUrlRefs.current.set(index, url);
        }
        const url = objectUrlRefs.current.get(index);
        return url || URL.createObjectURL(item); // Fallback if somehow missing
      }
      // Already uploaded URL - ensure it's a valid string
      if (typeof item === "string" && item.trim().length > 0) {
        return item;
      }
      // Return null for invalid media (will be skipped in render)
      return null;
    });
  }, [media]);

  const handlePreview = (item: MediaItem, url: string) => {
    if (isVideo(item)) {
      setPreviewMedia({ url, type: "video" });
    } else {
      setPreviewMedia({ url, type: "image" });
    }
  };

  if (disabled) {
    return (
      <div className="space-y-2">
        <FieldLabel>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </FieldLabel>
        {media.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {media.map((item, index) => {
              const mediaUrl = mediaUrls[index];

              // Skip rendering if no valid URL
              if (
                !mediaUrl ||
                typeof mediaUrl !== "string" ||
                mediaUrl.trim().length === 0
              ) {
                return null;
              }

              const itemIsVideo = isVideo(item);

              return (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden border cursor-pointer"
                  onClick={() => handlePreview(item, mediaUrl)}
                >
                  {itemIsVideo ? (
                    <div className="relative w-full h-full bg-black flex items-center justify-center">
                      <video
                        src={mediaUrl}
                        className="w-full h-full object-cover"
                        preload="metadata"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Play className="h-12 w-12 text-white" fill="white" />
                      </div>
                    </div>
                  ) : (
                    <Image
                      src={mediaUrl}
                      alt={`Media ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                      unoptimized={
                        mediaUrl.startsWith("http://127.0.0.1") ||
                        mediaUrl.startsWith("http://localhost") ||
                        mediaUrl.startsWith("blob:")
                      }
                      onError={(e) => {
                        console.error("Image load error:", mediaUrl, e);
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <FieldLabel>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          <span className="text-xs text-muted-foreground ml-2">
            ({allowImages && allowVideos
              ? "Images & Videos"
              : allowImages
              ? "Images only"
              : "Videos only"})
          </span>
        </FieldLabel>

        {/* Media Preview Grid */}
        {media.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {media.map((item, index) => {
              const mediaUrl = mediaUrls[index];
              const isPending = item instanceof File;
              const itemIsVideo = isVideo(item);

              // Skip rendering if no valid URL
              if (
                !mediaUrl ||
                typeof mediaUrl !== "string" ||
                mediaUrl.trim().length === 0
              ) {
                return null;
              }

              // Use transformed thumbnail URL for uploaded images, original for local files
              const displayUrl =
                item instanceof File || itemIsVideo
                  ? mediaUrl
                  : getThumbnailUrl(mediaUrl);
              const isLocal =
                mediaUrl.startsWith("http://127.0.0.1") ||
                mediaUrl.startsWith("http://localhost") ||
                mediaUrl.startsWith("blob:");

              return (
                <div
                  key={index}
                  className={cn(
                    "relative aspect-square rounded-lg overflow-hidden border group",
                    !isPending && "cursor-pointer"
                  )}
                  onClick={() => !isPending && handlePreview(item, mediaUrl)}
                >
                  {itemIsVideo ? (
                    <div className="relative w-full h-full bg-black flex items-center justify-center">
                      <video
                        src={displayUrl}
                        className="w-full h-full object-cover"
                        preload="metadata"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                        <Play className="h-12 w-12 text-white" fill="white" />
                      </div>
                      <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-0.5 rounded text-xs flex items-center gap-1">
                        <Film className="h-3 w-3" />
                        Video
                      </div>
                    </div>
                  ) : (
                    <>
                      <Image
                        src={displayUrl}
                        alt={`Media ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                        unoptimized={isLocal}
                        onError={(e) => {
                          console.error("Image load error:", displayUrl, e);
                        }}
                      />
                      <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-0.5 rounded text-xs flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        Image
                      </div>
                    </>
                  )}
                  {isPending && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                      <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">
                        Pending upload
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveMedia(index);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    aria-label="Remove media"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Dropzone */}
        {media.length < maxFiles && (
          <Dropzone {...uploadHook} enableCamera={allowImages}>
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>
        )}

        {media.length >= maxFiles && (
          <p className="text-sm text-muted-foreground">
            Maximum {maxFiles} files reached
          </p>
        )}

        {allowVideos && (
          <p className="text-xs text-muted-foreground">
            Max file size: 25MB for videos, 5MB for images
          </p>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog
        open={previewMedia !== null}
        onOpenChange={(open) => !open && setPreviewMedia(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {previewMedia?.type === "video" ? "Video Preview" : "Image Preview"}
            </DialogTitle>
          </DialogHeader>
          <div className="relative w-full">
            {previewMedia?.type === "video" ? (
              <video
                src={previewMedia.url}
                controls
                className="w-full rounded-lg"
                autoPlay
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              previewMedia && (
                <Image
                  src={previewMedia.url}
                  alt="Preview"
                  width={1200}
                  height={800}
                  className="w-full h-auto rounded-lg"
                  unoptimized={
                    previewMedia.url.startsWith("http://127.0.0.1") ||
                    previewMedia.url.startsWith("http://localhost") ||
                    previewMedia.url.startsWith("blob:")
                  }
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

