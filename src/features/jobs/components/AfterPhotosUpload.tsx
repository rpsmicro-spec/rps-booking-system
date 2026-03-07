"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaUpload } from "./MediaUpload";
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

type MediaItem = File | string;

export function AfterPhotosUpload({ job, onUpdate }: AfterPhotosUploadProps) {
  const [media, setMedia] = useState<MediaItem[]>(job.after_photos || []);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  // Update media when job changes
  useEffect(() => {
    setMedia(job.after_photos || []);
  }, [job.after_photos]);

  // Show component only when status is in_progress (not completed)
  if (job.status !== JOB_STATUS.IN_PROGRESS) {
    return null;
  }

  const handleMediaChange = (newMedia: MediaItem[]) => {
    // Separate files from URLs
    const files = newMedia.filter((p) => p instanceof File) as File[];
    const urls = newMedia.filter((p) => typeof p === "string") as string[];

    // Get current uploaded URLs
    const currentUrls = media.filter((p) => typeof p === "string") as string[];
    
    // Check if any uploaded media were removed
    const removedUrls = currentUrls.filter((url) => !urls.includes(url));
    
    // If media were removed (not just files added), save immediately
    if (removedUrls.length > 0) {
      handleSaveMedia(urls, files);
      return;
    }

    // Keep existing URLs and add new files
    setMedia([...urls, ...files]);
    setPendingFiles(files);
  };

  const handleSaveMedia = async (urls: string[], files: File[] = []) => {
    setIsUploading(true);
    try {
      let allUrls = [...urls];

      // Upload any new files first
      if (files.length > 0) {
        const uploadPromises = files.map((file) =>
          uploadFile(file, {
            bucket: "job-photos",
            compress: file.type.startsWith('image/'), // Only compress images, not videos
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
          ? "After media updated successfully"
          : "Media removed successfully"
      );
      setMedia(allUrls);
      setPendingFiles([]);
      onUpdate?.();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update media. Please try again."
      );
      // Reset to current job media on error
      setMedia(job.after_photos || []);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (pendingFiles.length === 0) {
      toast.info("No new media to upload");
      return;
    }

    const existingUrls = media.filter(
      (p) => typeof p === "string"
    ) as string[];
    await handleSaveMedia(existingUrls, pendingFiles);
  };

  const hasPendingUploads = pendingFiles.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>After Photos & Videos</CardTitle>
        <CardDescription>
          Add photos or videos. 25 MB per video, 5 MB per image.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <MediaUpload
          media={media}
          onMediaChange={handleMediaChange}
          maxFiles={10}
          bucket="job-photos"
          disabled={isUploading}
          allowImages={true}
          allowVideos={true}
          emptyStateVariant="minimal"
        />
        {hasPendingUploads && (
          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              {pendingFiles.length} file{pendingFiles.length > 1 ? "s" : ""}{" "}
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
                  Upload {pendingFiles.length} File
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

