"use client";

import { useEffect, useRef, useMemo } from "react";
import { FieldLabel } from "@/components/ui/field";
import { X } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/dropzone";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";
import { getThumbnailUrl } from "../utils/image-url";

// Type for photos - can be File (pending upload) or string (already uploaded URL)
type PhotoItem = File | string;

interface PhotoUploadProps {
  photos: PhotoItem[];
  onPhotosChange: (photos: PhotoItem[]) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  maxPhotos?: number;
  bucket?: "job-photos" | "invoices" | "temp-uploads";
}

export function PhotoUpload({
  photos,
  onPhotosChange,
  label = "Photos",
  required = false,
  disabled = false,
  maxPhotos = 10,
  bucket = "job-photos",
}: PhotoUploadProps) {
  const objectUrlRefs = useRef<Map<number, string>>(new Map());
  const onPhotosChangeRef = useRef(onPhotosChange);
  const photosRef = useRef(photos);

  // Keep refs in sync
  useEffect(() => {
    onPhotosChangeRef.current = onPhotosChange;
    photosRef.current = photos;
  }, [onPhotosChange, photos]);

  const uploadHook = useSupabaseUpload({
    bucketName: bucket,
    allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxFiles: maxPhotos - photos.length,
  });

  // Handle file selection - add files to photos array (not upload yet)
  useEffect(() => {
    const files = uploadHook.files;
    if (files.length > 0) {
      const currentPhotos = photosRef.current;
      // Check max photos limit
      if (currentPhotos.length + files.length > maxPhotos) {
        toast.error(`Maximum ${maxPhotos} photos allowed`);
        uploadHook.setFiles([]);
        return;
      }

      // Add files to photos array (they'll be uploaded on form submit)
      onPhotosChangeRef.current([...currentPhotos, ...files]);
      uploadHook.setFiles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadHook.files.length, maxPhotos]);

  // Clean up object URLs when photos are removed
  const handleRemovePhoto = (index: number) => {
    const photo = photos[index];
    // If it's a File, clean up its object URL
    if (photo instanceof File) {
      const objectUrl = objectUrlRefs.current.get(index);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrlRefs.current.delete(index);
      }
    }
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    const urls = objectUrlRefs.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  // Create object URLs for all File photos
  const photoUrls = useMemo(() => {
    // Clean up old object URLs that are no longer needed
    const currentIndices = new Set(photos.map((_, idx) => idx));
    objectUrlRefs.current.forEach((url, idx) => {
      if (!currentIndices.has(idx)) {
        URL.revokeObjectURL(url);
        objectUrlRefs.current.delete(idx);
      }
    });

    return photos.map((photo, index) => {
      if (photo instanceof File) {
        // Create object URL for File preview
        if (!objectUrlRefs.current.has(index)) {
          const url = URL.createObjectURL(photo);
          objectUrlRefs.current.set(index, url);
        }
        const url = objectUrlRefs.current.get(index);
        return url || URL.createObjectURL(photo); // Fallback if somehow missing
      }
      // Already uploaded URL - ensure it's a valid string
      if (typeof photo === "string" && photo.trim().length > 0) {
        return photo;
      }
      // Return null for invalid photos (will be skipped in render)
      return null;
    });
  }, [photos]);

  if (disabled) {
    return (
      <div className="space-y-2">
        <FieldLabel>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </FieldLabel>
        {photos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((photo, index) => {
              const photoUrl = photoUrls[index];

              // Skip rendering if no valid URL
              if (
                !photoUrl ||
                typeof photoUrl !== "string" ||
                photoUrl.trim().length === 0
              ) {
                return null;
              }

              return (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden border"
                >
                  <Image
                    src={photoUrl}
                    alt={`Photo ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                    unoptimized={
                      photoUrl.startsWith("http://127.0.0.1") ||
                      photoUrl.startsWith("http://localhost") ||
                      photoUrl.startsWith("blob:")
                    }
                    onError={(e) => {
                      console.error("Image load error:", photoUrl, e);
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <FieldLabel>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </FieldLabel>

      {/* Photo Preview Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {photos.map((photo, index) => {
            const photoUrl = photoUrls[index];
            const isPending = photo instanceof File;

            // Skip rendering if no valid URL
            if (
              !photoUrl ||
              typeof photoUrl !== "string" ||
              photoUrl.trim().length === 0
            ) {
              return null;
            }

            // Use transformed thumbnail URL for uploaded images, original for local files
            const displayUrl =
              photo instanceof File ? photoUrl : getThumbnailUrl(photoUrl);
            const isLocal =
              photoUrl.startsWith("http://127.0.0.1") ||
              photoUrl.startsWith("http://localhost") ||
              photoUrl.startsWith("blob:");

            return (
              <div
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden border group"
              >
                <Image
                  src={displayUrl}
                  alt={`Photo ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  unoptimized={isLocal}
                  onError={(e) => {
                    console.error("Image load error:", displayUrl, e);
                  }}
                />
                {isPending && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">
                      Pending upload
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove photo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Dropzone */}
      {photos.length < maxPhotos && (
        <Dropzone {...uploadHook} enableCamera={true}>
          <DropzoneEmptyState />
          <DropzoneContent />
        </Dropzone>
      )}

      {photos.length >= maxPhotos && (
        <p className="text-sm text-muted-foreground">
          Maximum {maxPhotos} photos reached
        </p>
      )}
    </div>
  );
}
