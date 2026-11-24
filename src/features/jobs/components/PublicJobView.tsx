"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, getStatusBadgeCustomClasses } from "@/lib/constants";
import { JobPhotoViewer } from "./JobPhotoViewer";
import { StatusTimeline, type StatusHistory } from "./StatusTimeline";
import { format } from "date-fns";
import { utcToIstDateObject } from "@/lib/utils/date-ist";
import type { Job, JobStatus } from "@/types/types";
import {
  Calendar,
  Package,
  Hash,
  FileText,
  ClipboardList,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { COMPANY_INFO } from "@/lib/constants";
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
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Job Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold tabular-nums">{job.job_number}</h1>
        {job.booking_date && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="tabular-nums">
              Booking Date:{" "}
              {(() => {
                const istDate = utcToIstDateObject(job.booking_date);
                return istDate ? format(istDate, "MMM dd, yyyy") : "";
              })()}
            </span>
          </div>
        )}
        {job.status && (
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge
              className={getStatusBadgeCustomClasses(job.status as JobStatus)}
            >
              {STATUS_LABELS[job.status as JobStatus] || "Unknown"}
            </Badge>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Job Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Job Details</CardTitle>
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
                  <p className="text-sm font-medium tabular-nums">{job.job_number}</p>
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
                  <p className="text-sm font-medium tabular-nums">
                    {(() => {
                      const istDate = utcToIstDateObject(job.booking_date);
                      return istDate ? format(istDate, "MMM dd, yyyy") : "";
                    })()}
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
                  <p className="text-sm font-medium tabular-nums">
                    {(() => {
                      const istDate = utcToIstDateObject(job.delivery_date);
                      return istDate ? format(istDate, "MMM dd, yyyy") : "";
                    })()}
                  </p>
                </div>
              </div>
            )}
            {(job as Job & { customer_dc_number?: string })
              .customer_dc_number && (
              <div className="flex items-start gap-4">
                <div className="shrink-0 mt-0.5">
                  <div className="rounded-full bg-muted p-2">
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    Customer DC Number
                  </p>
                  <p className="text-sm font-medium tabular-nums">
                    {
                      (job as Job & { customer_dc_number?: string })
                        .customer_dc_number
                    }
                    {(job as Job & { customer_dc_date?: string })
                      .customer_dc_date && (
                      <span className="text-xs font-normal text-muted-foreground ml-2 block sm:inline">
                        •{" "}
                        {(() => {
                          const dcDate = (
                            job as Job & { customer_dc_date?: string }
                          ).customer_dc_date;
                          if (!dcDate) return "";
                          const istDate = utcToIstDateObject(dcDate);
                          return istDate ? format(istDate, "MMM dd, yyyy") : "";
                        })()}
                      </span>
                    )}
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
            {job.special_requirements && (
              <div className="flex items-start gap-4">
                <div className="shrink-0 mt-0.5">
                  <div className="rounded-full bg-muted p-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    Customer Notes
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {job.special_requirements}
                  </p>
                </div>
              </div>
            )}
            {job.status && (
              <>
                <hr className="border-border my-4" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-3">
                    Status Timeline
                  </p>
                  <StatusTimeline
                    currentStatus={job.status as JobStatus}
                    statusHistory={statusHistory}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Contact Us - same row as Job Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                <div className="rounded-full bg-muted p-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  Address
                </p>
                <p className="text-sm whitespace-pre-line leading-relaxed">
                  {COMPANY_INFO.ADDRESS}
                </p>
              </div>
            </div>
            {COMPANY_INFO.PHONE && (
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <div className="rounded-full bg-muted p-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    Phone
                  </p>
                  <a
                    href={`tel:${COMPANY_INFO.PHONE.replace(/[^\d+]/g, "")}`}
                    className="text-sm tabular-nums hover:underline"
                  >
                    {COMPANY_INFO.PHONE}
                  </a>
                  {COMPANY_INFO.TEL && (
                    <p className="text-sm tabular-nums text-muted-foreground mt-1">
                      {COMPANY_INFO.TEL}
                    </p>
                  )}
                </div>
              </div>
            )}
            {COMPANY_INFO.EMAIL && (
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <div className="rounded-full bg-muted p-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    Email
                  </p>
                  <a
                    href={`mailto:${COMPANY_INFO.EMAIL}`}
                    className="text-sm hover:underline break-all"
                  >
                    {COMPANY_INFO.EMAIL}
                  </a>
                </div>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Location
              </p>
              <div className="rounded-lg overflow-hidden border aspect-video">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1943.0054346450845!2d80.17156813013989!3d13.098497570286531!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5263001c995869%3A0xca1357dca97bd8b7!2sRPS%20Micro%20Electronics!5e0!3m2!1sen!2sin!4v1764003201324!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full min-h-[200px]"
                  title={`${COMPANY_INFO.NAME} location`}
                />
              </div>
              <a
                href={COMPANY_INFO.GOOGLE_MAPS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline mt-2 inline-block"
              >
                Open in Google Maps →
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Photos - Show before and after in tabs */}
      {((job.before_photos?.length ?? 0) > 0 ||
        (job.after_photos?.length ?? 0) > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Photos & Videos</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {(job.before_photos?.length || 0) > 0 &&
            (job.after_photos?.length || 0) > 0 ? (
              <Tabs defaultValue="before" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="before">
                    Before Photos
                    {job.before_photos && job.before_photos.length > 0 && (
                      <span className="ml-1">({job.before_photos.length})</span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="after">
                    After Photos
                    {job.after_photos && job.after_photos.length > 0 && (
                      <span className="ml-1">({job.after_photos.length})</span>
                    )}
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
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Invoice</CardTitle>
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

    </div>
  );
}
