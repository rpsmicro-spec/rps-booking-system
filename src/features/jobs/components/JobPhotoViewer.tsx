"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getThumbnailUrl, getFullSizeImageUrl } from "../utils/image-url";

interface JobPhotoViewerProps {
  photos: string[];
  title?: string;
  className?: string;
}

export function JobPhotoViewer({
  photos,
  title,
  className = "",
}: JobPhotoViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Handle keyboard navigation
  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedIndex(null);
      } else if (e.key === "ArrowLeft" && photos.length > 1) {
        setSelectedIndex(
          selectedIndex > 0 ? selectedIndex - 1 : photos.length - 1
        );
      } else if (e.key === "ArrowRight" && photos.length > 1) {
        setSelectedIndex(
          selectedIndex < photos.length - 1 ? selectedIndex + 1 : 0
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, photos.length]);

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

      {/* Custom Lightbox Modal */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          {/* Close Button - Only one */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 text-white hover:bg-white/20 h-9 w-9 sm:h-10 sm:w-10"
            onClick={closeLightbox}
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>

          {/* Previous Button */}
          {photos.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-10 w-10 sm:h-12 sm:w-12"
              onClick={(e) => {
                e.stopPropagation();
                navigatePhoto("prev");
              }}
            >
              <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
            </Button>
          )}

          {/* Next Button */}
          {photos.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-10 w-10 sm:h-12 sm:w-12"
              onClick={(e) => {
                e.stopPropagation();
                navigatePhoto("next");
              }}
            >
              <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
            </Button>
          )}

          {/* Image */}
          <div
            className="relative w-full h-full flex items-center justify-center p-2 sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={getFullSizeImageUrl(photos[selectedIndex])}
              alt={`Photo ${selectedIndex + 1}`}
              width={1920}
              height={1080}
              className="max-w-full max-h-full object-contain"
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
            <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 text-white text-xs sm:text-sm bg-black/50 px-3 sm:px-4 py-1.5 sm:py-2 rounded">
              {selectedIndex + 1} / {photos.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}

