"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotoUpload } from "./PhotoUpload";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import { uploadFile } from "../utils/upload";
import type { Job } from "@/types/types";
import { JOB_STATUS } from "@/lib/constants";

interface AfterPhotosUploadProps {
  job: Job;
  onUpdate?: () => void;
}

type PhotoItem = File | string;

export function AfterPhotosUpload({ job, onUpdate }: AfterPhotosUploadProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>(job.after_photos || []);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  // Update photos when job changes
  useEffect(() => {
    setPhotos(job.after_photos || []);
  }, [job.after_photos]);

  // Show component only when status is in_progress (not completed)
  if (job.status !== JOB_STATUS.IN_PROGRESS) {
    return null;
  }

  const handlePhotosChange = (newPhotos: PhotoItem[]) => {
    // Separate files from URLs
    const files = newPhotos.filter((p) => p instanceof File) as File[];
    const urls = newPhotos.filter((p) => typeof p === "string") as string[];

    // Get current uploaded URLs
    const currentUrls = photos.filter((p) => typeof p === "string") as string[];
    
    // Check if any uploaded photos were removed
    const removedUrls = currentUrls.filter((url) => !urls.includes(url));
    
    // If photos were removed (not just files added), save immediately
    if (removedUrls.length > 0) {
      handleSavePhotos(urls, files);
      return;
    }

    // Keep existing URLs and add new files
    setPhotos([...urls, ...files]);
    setPendingFiles(files);
  };

  const handleSavePhotos = async (urls: string[], files: File[] = []) => {
    setIsUploading(true);
    try {
      let allUrls = [...urls];

      // Upload any new files first
      if (files.length > 0) {
        const uploadPromises = files.map((file) =>
          uploadFile(file, {
            bucket: "job-photos",
            compress: true,
            maxSizeMB: 5,
          })
        );

        const uploadedUrls = await Promise.all(uploadPromises);
        allUrls = [...allUrls, ...uploadedUrls];
      }

      // Update job via API
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          after_photos: allUrls,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update job");
      }

      toast.success(
        files.length > 0
          ? "After photos updated successfully"
          : "Photo removed successfully"
      );
      setPhotos(allUrls);
      setPendingFiles([]);
      onUpdate?.();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update photos. Please try again."
      );
      // Reset to current job photos on error
      setPhotos(job.after_photos || []);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (pendingFiles.length === 0) {
      toast.info("No new photos to upload");
      return;
    }

    const existingUrls = photos.filter(
      (p) => typeof p === "string"
    ) as string[];
    await handleSavePhotos(existingUrls, pendingFiles);
  };

  const hasPendingUploads = pendingFiles.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>After Photos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <PhotoUpload
          photos={photos}
          onPhotosChange={handlePhotosChange}
          label="Upload After Photos"
          maxPhotos={10}
          bucket="job-photos"
          disabled={isUploading}
        />
        {hasPendingUploads && (
          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              {pendingFiles.length} photo{pendingFiles.length > 1 ? "s" : ""}{" "}
              ready to upload
            </p>
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
                  Upload {pendingFiles.length} Photo
                  {pendingFiles.length > 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

