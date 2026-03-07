"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS, getStatusBadgeCustomClasses } from "@/lib/constants";
import type { Job, JobStatus } from "@/types/types";
import {
  Calendar,
  Phone,
  Mail,
  Package,
  MapPin,
  Camera,
  FileText,
  Eye,
  Edit,
  Trash2,
  Truck,
  Video,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { utcToIstDateObject } from "@/lib/utils/date-ist";
import { formatAddressSingleLine } from "@/lib/utils/address";

interface JobCardMobileProps {
  job: Job;
  onCardClick?: (jobId: string) => void;
  showActions?: boolean;
  onEdit?: (jobId: string) => void;
  onDelete?: (job: Job) => void;
}

export function JobCardMobile({
  job,
  onCardClick,
  showActions = false,
  onEdit,
  onDelete,
}: JobCardMobileProps) {
  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(job.id);
    }
  };

  // Helper to check if a URL is a video file
  // Check for video extensions explicitly
  const isVideoFile = (url: string): boolean => {
    const urlLower = url.toLowerCase();
    // Video extensions
    const videoExtensions = [
      ".mp4",
      ".webm",
      ".mov",
      ".avi",
      ".mkv",
      ".m4v",
      ".quicktime",
    ];
    return videoExtensions.some((ext) => urlLower.includes(ext));
  };

  // Separate photos and videos
  const allMedia = [...(job.before_photos || []), ...(job.after_photos || [])];
  const photos = allMedia.filter((url) => !isVideoFile(url));
  const videos = allMedia.filter((url) => isVideoFile(url));
  const photoCount = photos.length;
  const videoCount = videos.length;

  const hasInvoice = !!(job.invoice_file_path || job.invoice_url);

  const bookingDate = job.booking_date
    ? (() => {
        const istDate = utcToIstDateObject(job.booking_date);
        return istDate ? format(istDate, "MMM dd, yyyy") : null;
      })()
    : null;

  const deliveryDate = job.delivery_date
    ? (() => {
        const istDate = utcToIstDateObject(job.delivery_date);
        return istDate ? format(istDate, "MMM dd, yyyy") : null;
      })()
    : null;

  // Get full address
  const fullAddress = formatAddressSingleLine(job);

  // Get DC number
  const dcNumber = (job as Job & { customer_dc_number?: string | null })
    .customer_dc_number;

  // Phone numbers
  const phoneNumbers =
    (job as Job & { phone_numbers?: string[] }).phone_numbers || [];
  const primaryPhone = job.contact_number;
  const additionalPhones = phoneNumbers.filter((p) => p && p.trim() !== "");
  const totalPhones = additionalPhones.length;

  // Emails
  const emails = (job as Job & { emails?: string[] }).emails || [];
  const primaryEmail = job.email?.trim() || null;
  const additionalEmails = emails.filter((e) => e && e.trim() !== "");
  const totalEmails = additionalEmails.length;

  const contactPerson = (job as Job & { contact_person_name?: string })
    .contact_person_name;
  const contactDesignation = (
    job as Job & { contact_person_designation?: string }
  ).contact_person_designation;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className="rounded-xl border border-border/80 bg-card overflow-hidden cursor-pointer transition-colors hover:bg-muted/30 active:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="p-4 space-y-3">
        {/* Header: Job Number + Customer | Badge + Chevron */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-foreground truncate">
              {job.job_number}
            </h3>
            <p className="text-sm text-foreground/90 mt-0.5 wrap-break-word">
              {job.customer_name}
            </p>
            {contactPerson && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {contactPerson}
                {contactDesignation && (
                  <span className="ml-1 text-muted-foreground/70">
                    • {contactDesignation}
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {job.status && (
              <Badge
                className={`${getStatusBadgeCustomClasses(job.status as JobStatus)} text-[10px] px-2 py-0 h-5 font-medium`}
              >
                {STATUS_LABELS[job.status as JobStatus] || "Unknown"}
              </Badge>
            )}
            <ChevronRight className="h-5 w-5 text-muted-foreground/60 mt-0.5" aria-hidden />
          </div>
        </div>

        {/* Quick Info */}
        <div className="space-y-1.5">
          {job.material_type && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
              <span className="wrap-break-word">{job.material_type}</span>
            </div>
          )}
          {fullAddress && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground/70" />
              <span className="wrap-break-word line-clamp-2">
                {fullAddress}
              </span>
            </div>
          )}
          {dcNumber && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
              <span className="wrap-break-word">DC: {dcNumber}</span>
            </div>
          )}
        </div>

        <div className="space-y-3 pt-1">
        {/* Dates Row */}
        {(bookingDate || deliveryDate) && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            {bookingDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                <span>Booked {bookingDate}</span>
              </div>
            )}
            {deliveryDate && (
              <div className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                <span>Delivery {deliveryDate}</span>
              </div>
            )}
          </div>
        )}

        {/* Media & invoice chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {photoCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/60 text-xs font-medium tabular-nums">
              <Camera className="h-3 w-3 text-muted-foreground" />
              {photoCount} {photoCount === 1 ? "photo" : "photos"}
            </span>
          )}
          {videoCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/60 text-xs font-medium tabular-nums">
              <Video className="h-3 w-3 text-muted-foreground" />
              {videoCount} {videoCount === 1 ? "video" : "videos"}
            </span>
          )}
          {hasInvoice && (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/60 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              Invoice
            </span>
          )}
        </div>

        {/* Contact Info */}
        {(primaryPhone || primaryEmail) && (
          <div className="flex items-center gap-4 flex-wrap pt-3 border-t border-border/60">
            {primaryPhone && (
              <a
                href={`tel:${primaryPhone}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {primaryPhone}
                  {totalPhones > 0 && (
                    <span className="text-muted-foreground ml-1">
                      + {totalPhones}
                    </span>
                  )}
                </span>
              </a>
            )}
            {primaryEmail && (
              <a
                href={`mailto:${primaryEmail}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {primaryEmail}
                  {totalEmails > 0 && (
                    <span className="text-muted-foreground ml-1">
                      + {totalEmails}
                    </span>
                  )}
                </span>
              </a>
            )}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div
            className="flex items-center gap-2 pt-3 border-t border-border/60"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-8"
              asChild
              onClick={(e) => e.stopPropagation()}
            >
              <Link href={`/jobs/${job.id}`}>
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                View
              </Link>
            </Button>
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-8"
                asChild
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(job.id);
                }}
              >
                <Link href={`/jobs/${job.id}/edit`}>
                  <Edit className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Link>
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 text-destructive hover:text-destructive px-3"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(job);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
        </div>
      </div>
    </article>
  );
}
