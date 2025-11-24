"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
} from "lucide-react";
import { format } from "date-fns";
import { utcToIstDateObject } from "@/lib/utils/date-ist";
import { formatAddressSingleLine } from "@/lib/utils/address";

const STATUS_ICONS: Record<string, typeof Calendar> = {
  collected: Calendar,
  in_progress: Package,
  completed: Package,
  delivered: Truck,
};

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

  const StatusIcon = job.status
    ? STATUS_ICONS[job.status] || Calendar
    : Calendar;

  return (
    <Card
      className="cursor-pointer transition-all active:scale-[0.98] active:opacity-90 active:shadow-md"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3 space-y-2">
        {/* Header: Job Number + Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-base text-foreground truncate">
                {job.job_number}
              </h3>
              {job.status && (
                <StatusIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
            </div>
            <p className="text-sm font-medium text-foreground wrap-break-word">
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
          <Badge
            className={`${getStatusBadgeCustomClasses(job.status as JobStatus)} shrink-0 ml-2 text-[10px] px-2 py-0.5 font-semibold`}
          >
            {job.status
              ? STATUS_LABELS[job.status as JobStatus] || "Unknown"
              : "Unknown"}
          </Badge>
        </div>

        {/* Quick Info Row */}
        <div className="space-y-1.5 pt-1">
          {job.material_type && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Package className="h-3 w-3 shrink-0" />
              <span className="wrap-break-word">{job.material_type}</span>
            </div>
          )}
          {fullAddress && (
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
              <span className="wrap-break-word line-clamp-2">
                {fullAddress}
              </span>
            </div>
          )}
          {dcNumber && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="h-3 w-3 shrink-0" />
              <span className="wrap-break-word">DC: {dcNumber}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Dates Row */}
        {(bookingDate || deliveryDate) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            {bookingDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span className="font-medium">Booked:</span>
                <span>{bookingDate}</span>
              </div>
            )}
            {bookingDate && deliveryDate && (
              <span className="text-muted-foreground/50">|</span>
            )}
            {deliveryDate && (
              <div className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 shrink-0" />
                <span className="font-medium">Delivery:</span>
                <span>{deliveryDate}</span>
              </div>
            )}
          </div>
        )}

        {/* Media Indicators Row */}
        <div className="flex items-center gap-3 flex-wrap">
          {photoCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 text-xs">
              <Camera className="h-3 w-3" />
              <span className="font-medium">{photoCount}</span>
              <span className="text-muted-foreground">
                {photoCount === 1 ? "photo" : "photos"}
              </span>
            </div>
          )}
          {videoCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 text-xs">
              <Video className="h-3 w-3" />
              <span className="font-medium">{videoCount}</span>
              <span className="text-muted-foreground">
                {videoCount === 1 ? "video" : "videos"}
              </span>
            </div>
          )}
          {hasInvoice && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 text-xs">
              <FileText className="h-3 w-3" />
              <span className="text-muted-foreground">Invoice</span>
            </div>
          )}
        </div>

        {/* Contact Info */}
        {(primaryPhone || primaryEmail) && (
          <div className="flex items-center gap-3 flex-wrap pt-3 border-t">
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
            className="flex items-center gap-2 pt-2 border-t"
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
      </CardContent>
    </Card>
  );
}
