"use client";

import { useState } from "react";
import Image from "next/image";
import { PhotoProvider, PhotoView } from "react-photo-view";
import { Play, Film } from "lucide-react";
import { getThumbnailUrl, getFullSizeImageUrl } from "../utils/image-url";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface JobPhotoViewerProps {
  photos: string[];
  title?: string;
  className?: string;
}

// Helper to check if URL is a video
function isVideo(url: string): boolean {
  const videoExtensions = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v"];
  return videoExtensions.some((ext) =>
    url.toLowerCase().includes(ext.toLowerCase())
  );
}

// Helper to get video MIME type from URL
function getVideoType(url: string): string {
  const urlLower = url.toLowerCase();
  if (urlLower.includes(".mp4") || urlLower.includes(".m4v")) {
    return "video/mp4";
  }
  if (urlLower.includes(".webm")) {
    return "video/webm";
  }
  if (urlLower.includes(".mov")) {
    return "video/quicktime";
  }
  if (urlLower.includes(".avi")) {
    return "video/x-msvideo";
  }
  if (urlLower.includes(".mkv")) {
    return "video/x-matroska";
  }
  // Default to mp4 as it's the most common
  return "video/mp4";
}

export function JobPhotoViewer({
  photos,
  title,
  className = "",
}: JobPhotoViewerProps) {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(
    null
  );

  if (photos.length === 0) {
    return null;
  }

  // Separate images and videos
  const imagePhotos = photos.filter((photo) => !isVideo(photo));
  const videoPhotos = photos
    .map((photo, index) => ({ photo, originalIndex: index }))
    .filter(({ photo }) => isVideo(photo));

  return (
    <>
      <div className={className}>
        {title && <h4 className="text-sm font-medium mb-2">{title}</h4>}

        {/* Images Gallery with react-photo-view */}
        {imagePhotos.length > 0 && (
          <PhotoProvider>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {imagePhotos.map((photo, index) => {
                const thumbnailUrl = getThumbnailUrl(photo);
                const fullSizeUrl = getFullSizeImageUrl(photo);
                const isLocal =
                  photo.startsWith("http://127.0.0.1") ||
                  photo.startsWith("http://localhost") ||
                  photo.startsWith("blob:");

                return (
                  <PhotoView key={index} src={fullSizeUrl}>
                    <button
                      type="button"
                      className="relative aspect-square rounded-lg overflow-hidden border hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <Image
                        src={thumbnailUrl}
                        alt={`${title || "Photo"} ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                        quality={80}
                        unoptimized={isLocal}
                      />
                    </button>
                  </PhotoView>
                );
              })}
            </div>
          </PhotoProvider>
        )}

        {/* Videos Gallery */}
        {videoPhotos.length > 0 && (
          <div
            className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${imagePhotos.length > 0 ? "mt-4" : ""}`}
          >
            {videoPhotos.map(({ photo, originalIndex }) => (
              <button
                key={originalIndex}
                type="button"
                onClick={() => setSelectedVideoIndex(originalIndex)}
                className="relative aspect-square rounded-lg overflow-hidden border hover:opacity-90 transition-opacity cursor-pointer"
              >
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                  <video
                    src={photo}
                    className="w-full h-full object-cover"
                    preload="none"
                    muted
                    playsInline
                    aria-label={`${title || "Video"} thumbnail ${originalIndex + 1}`}
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                    <Play className="h-12 w-12 text-white" fill="white" />
                  </div>
                  <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-0.5 rounded text-xs flex items-center gap-1">
                    <Film className="h-3 w-3" />
                    Video
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Video Dialog */}
      {selectedVideoIndex !== null && (
        <Dialog
          open={selectedVideoIndex !== null}
          onOpenChange={() => setSelectedVideoIndex(null)}
        >
          <DialogContent className="max-w-6xl max-h-[90vh] p-0 bg-black/95">
            <DialogHeader className="sr-only">
              <DialogTitle>
                {title ? `${title} - Video ${selectedVideoIndex + 1}` : `Video ${selectedVideoIndex + 1}`}
              </DialogTitle>
            </DialogHeader>
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <video
                controls
                autoPlay
                muted
                playsInline
                preload="none"
                className="max-w-full max-h-full rounded-lg"
                style={{ maxHeight: "85vh" }}
                aria-label={`${title || "Video"} player`}
              >
                <source
                  src={photos[selectedVideoIndex]}
                  type={getVideoType(photos[selectedVideoIndex])}
                />
                Your browser does not support the video tag.
              </video>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
