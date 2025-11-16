"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { JobPhotoViewer } from "./JobPhotoViewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Job } from "@/types/types";

interface AllPhotosDialogProps {
  job: Job;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AllPhotosDialog({ job, open, onOpenChange }: AllPhotosDialogProps) {
  const hasBeforePhotos = job.before_photos && job.before_photos.length > 0;
  const hasAfterPhotos = job.after_photos && job.after_photos.length > 0;

  if (!hasBeforePhotos && !hasAfterPhotos) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>All Photos</DialogTitle>
        </DialogHeader>
        <div className="pt-4">
          {hasBeforePhotos && hasAfterPhotos ? (
            <Tabs defaultValue="before" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="before">
                  Before Photos ({job.before_photos?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="after">
                  After Photos ({job.after_photos?.length || 0})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="before" className="mt-4">
                <JobPhotoViewer
                  photos={job.before_photos || []}
                  title="Before Photos"
                />
              </TabsContent>
              <TabsContent value="after" className="mt-4">
                <JobPhotoViewer
                  photos={job.after_photos || []}
                  title="After Photos"
                />
              </TabsContent>
            </Tabs>
          ) : hasBeforePhotos ? (
            <JobPhotoViewer
              photos={job.before_photos || []}
              title="Before Photos"
            />
          ) : (
            <JobPhotoViewer
              photos={job.after_photos || []}
              title="After Photos"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

