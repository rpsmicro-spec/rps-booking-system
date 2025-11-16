"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getThumbnailUrl, getFullSizeImageUrl } from "../utils/image-url";

interface PhotoGalleryProps {
  photos: string[];
  title?: string;
  className?: string;
}

export function PhotoGallery({
  photos,
  title,
  className = "",
}: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return null;
  }

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const navigatePhoto = (direction: "prev" | "next") => {
    if (selectedIndex === null) return;

    if (direction === "prev") {
      setSelectedIndex(
        selectedIndex > 0 ? selectedIndex - 1 : photos.length - 1
      );
    } else {
      setSelectedIndex(
        selectedIndex < photos.length - 1 ? selectedIndex + 1 : 0
      );
    }
  };

  return (
    <>
      <div className={className}>
        {title && <h4 className="text-sm font-medium mb-2">{title}</h4>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {photos.map((photo, index) => {
            // Use transformed thumbnail URL for gallery thumbnails
            const thumbnailUrl = getThumbnailUrl(photo);
            const isLocal =
              photo.startsWith("http://127.0.0.1") ||
              photo.startsWith("http://localhost") ||
              photo.startsWith("blob:");

            return (
              <button
                key={index}
                type="button"
                onClick={() => openLightbox(index)}
                className="relative aspect-square rounded-lg overflow-hidden border hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Image
                  src={thumbnailUrl}
                  alt={`${title || "Photo"} ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  unoptimized={isLocal}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Lightbox Dialog */}
      <Dialog
        open={selectedIndex !== null}
        onOpenChange={(open) => !open && closeLightbox()}
      >
        <DialogContent className="max-w-7xl w-full p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Photo Viewer</DialogTitle>
          </DialogHeader>
          {selectedIndex !== null && (
            <div className="relative w-full h-[80vh] bg-black">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                onClick={closeLightbox}
              >
                <X className="h-6 w-6" />
              </Button>

              {/* Previous Button */}
              {photos.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={() => navigatePhoto("prev")}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
              )}

              {/* Next Button */}
              {photos.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={() => navigatePhoto("next")}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              )}

              {/* Image */}
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={getFullSizeImageUrl(photos[selectedIndex])}
                  alt={`Photo ${selectedIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                  unoptimized={
                    photos[selectedIndex]?.startsWith("http://127.0.0.1") ||
                    photos[selectedIndex]?.startsWith("http://localhost") ||
                    photos[selectedIndex]?.startsWith("blob:")
                  }
                />
              </div>

              {/* Photo Counter */}
              {photos.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded">
                  {selectedIndex + 1} / {photos.length}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
