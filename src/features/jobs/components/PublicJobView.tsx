"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { JobPhotoViewer } from "./JobPhotoViewer";
import { StatusTimeline, type StatusHistory } from "./StatusTimeline";
import { format } from "date-fns";
import type { Job, JobStatus } from "@/types/types";
import { Calendar, Package, Hash } from "lucide-react";
import { PDFViewer } from "@/components/pdf/PDFViewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import confetti from "canvas-confetti";

interface PublicJobViewProps {
  job: Job;
  statusHistory?: StatusHistory[];
}

export function PublicJobView({ job, statusHistory = [] }: PublicJobViewProps) {
  const confettiTriggered = useRef(false);

  useEffect(() => {
    // Only trigger confetti once when status is completed or delivered
    if (
      (job.status === "completed" || job.status === "delivered") &&
      !confettiTriggered.current
    ) {
      confettiTriggered.current = true;

      // Confetti from bottom left
      confetti({
        particleCount: 100,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 1 },
        colors: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"],
      });

      // Confetti from bottom right
      confetti({
        particleCount: 100,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 1 },
        colors: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"],
      });
    }
  }, [job.status]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Job Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{job.job_number}</h1>
        {job.created_at && (
          <p className="text-sm text-muted-foreground">
            {format(new Date(job.created_at), "MMM dd, yyyy")}
          </p>
        )}
        <p className="text-muted-foreground">
          Status:{" "}
          {job.status && <StatusBadge status={job.status as JobStatus} />}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Job Details */}
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {job.job_number && (
              <div className="flex items-start gap-4">
                <div className="shrink-0 mt-0.5">
                  <div className="rounded-full bg-muted p-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    Job Number
                  </p>
                  <p className="text-sm font-medium">{job.job_number}</p>
                </div>
              </div>
            )}
            {job.booking_date && (
              <div className="flex items-start gap-4">
                <div className="shrink-0 mt-0.5">
                  <div className="rounded-full bg-muted p-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    Booking Date
                  </p>
                  <p className="text-sm font-medium">
                    {format(new Date(job.booking_date), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
            )}
            {job.delivery_date && (
              <div className="flex items-start gap-4">
                <div className="shrink-0 mt-0.5">
                  <div className="rounded-full bg-muted p-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    Delivery Date
                  </p>
                  <p className="text-sm font-medium">
                    {format(new Date(job.delivery_date), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
            )}
            {job.material_type && (
              <div className="flex items-start gap-4">
                <div className="shrink-0 mt-0.5">
                  <div className="rounded-full bg-muted p-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    Material Type
                  </p>
                  <p className="text-sm">{job.material_type}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Timeline */}
        {job.status && (
          <Card>
            <CardHeader>
              <CardTitle>Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline
                currentStatus={job.status as JobStatus}
                statusHistory={statusHistory}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Photos - Show before and after in tabs */}
      {(job.before_photos?.length || job.after_photos?.length) && (
        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {(job.before_photos?.length || 0) > 0 &&
            (job.after_photos?.length || 0) > 0 ? (
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
            ) : job.before_photos && job.before_photos.length > 0 ? (
              <JobPhotoViewer
                photos={job.before_photos}
                title="Before Photos"
              />
            ) : job.after_photos && job.after_photos.length > 0 ? (
              <JobPhotoViewer photos={job.after_photos} title="After Photos" />
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Invoice */}
      {job.invoice_file_path && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <PDFViewer
              url={job.invoice_file_path}
              title="Invoice PDF"
              showDownload={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Note: Special Requirements are hidden from public view as per requirements */}
    </div>
  );
}
