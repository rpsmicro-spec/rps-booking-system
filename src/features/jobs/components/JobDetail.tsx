"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "./StatusBadge";
import { JobPhotoViewer } from "./JobPhotoViewer";
import { StatusTimeline, type StatusHistory } from "./StatusTimeline";
import { StatusUpdate } from "./StatusUpdate";
import { format } from "date-fns";
import type { Job, JobStatus } from "@/types/types";
import { MessageCircle, Mail, Hash, Calendar, Package, FileText, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getCustomerWhatsAppLink,
  generateStatusUpdateMessageToCustomer,
  generateCompletionMessageToCustomer,
  getJobViewUrl,
} from "@/lib/notifications/utils";
import { STATUS_LABELS, JOB_STATUS } from "@/lib/constants";
import { PDFViewer } from "@/components/pdf/PDFViewer";
import { toast } from "sonner";
import { useState } from "react";
import { AfterPhotosUpload } from "./AfterPhotosUpload";
import { InvoiceUploadDetail } from "./InvoiceUploadDetail";
import { AllPhotosDialog } from "./AllPhotosDialog";
import { InvoiceDialog } from "./InvoiceDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface JobDetailProps {
  job: Job;
  originalJob?: Job;
  statusHistory?: StatusHistory[];
  onStatusUpdate?: () => void;
  showStatusActions?: boolean;
  renderStatusCard?: boolean;
}

export function JobDetail({
  job,
  originalJob,
  statusHistory = [],
  onStatusUpdate,
  showStatusActions = true,
  renderStatusCard = true,
}: JobDetailProps) {
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [photosDialogOpen, setPhotosDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  // Generate WhatsApp message to customer based on current status
  const getWhatsAppMessageToCustomer = () => {
    if (!job.status || !job.contact_number) return null;

    const viewLink = getJobViewUrl(job);
    const statusLabel = STATUS_LABELS[job.status as JobStatus] || "Unknown";

    if (job.status === JOB_STATUS.COMPLETED) {
      return generateCompletionMessageToCustomer(job, viewLink);
    } else {
      return generateStatusUpdateMessageToCustomer(job, statusLabel, viewLink);
    }
  };

  const whatsAppMessage = getWhatsAppMessageToCustomer();
  const whatsAppLink =
    job.contact_number && whatsAppMessage
      ? getCustomerWhatsAppLink(job.contact_number, whatsAppMessage)
      : null;

  const handleSendEmail = async () => {
    if (!job.email || !job.public_token) {
      toast.error("Job does not have customer email or public token");
      return;
    }

    setIsSendingEmail(true);
    try {
      const notificationType = job.status === JOB_STATUS.COMPLETED ? 'completion' : 'status_change';
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          notificationType,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Failed to send email');
        return;
      }

      toast.success('Email sent successfully');
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // If only showing status card, return just that
  if (renderStatusCard && showStatusActions) {
    const hasPhotos = (job.before_photos?.length || 0) + (job.after_photos?.length || 0) > 0;
    const hasInvoice = !!job.invoice_file_path;

    return (
      <>
        <Card className="w-full">
          <CardContent className="pt-6">
            {job.status && (
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="w-full lg:flex-1 lg:min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Update Status</p>
                  <StatusUpdate
                    currentStatus={job.status as JobStatus}
                    jobId={job.id}
                    onStatusUpdate={onStatusUpdate}
                  />
                </div>
                <div className="flex flex-col lg:flex-row gap-2 w-full lg:w-auto lg:flex-shrink-0">
                  {job.email && job.public_token && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSendEmail}
                      disabled={isSendingEmail}
                      className="w-full lg:w-auto"
                    >
                      <Mail className="hidden lg:inline mr-2 h-4 w-4" />
                      {isSendingEmail ? 'Sending...' : 'Send Email'}
                    </Button>
                  )}
                  {whatsAppLink && (
                    <Button variant="outline" size="sm" asChild className="w-full lg:w-auto">
                      <a
                        href={whatsAppLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="hidden lg:inline mr-2 h-4 w-4" />
                        Send WhatsApp Message
                      </a>
                    </Button>
                  )}
                  {hasPhotos && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPhotosDialogOpen(true)}
                      className="w-full lg:w-auto"
                    >
                      {/* eslint-disable-next-line jsx-a11y/alt-text */}
                      <Image className="hidden lg:inline mr-2 h-4 w-4" />
                      View All Photos
                    </Button>
                  )}
                  {hasInvoice && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInvoiceDialogOpen(true)}
                      className="w-full lg:w-auto"
                    >
                      <FileText className="hidden lg:inline mr-2 h-4 w-4" />
                      View Invoice
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <AllPhotosDialog
          job={job}
          open={photosDialogOpen}
          onOpenChange={setPhotosDialogOpen}
        />
        <InvoiceDialog
          invoiceUrl={job.invoice_file_path}
          open={invoiceDialogOpen}
          onOpenChange={setInvoiceDialogOpen}
        />
      </>
    );
  }

  // Otherwise, show the rest of the content
  return (
    <div className="space-y-4 w-full">
      {/* Job Details and Status Timeline - Side by Side on Desktop */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Job Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Job Details</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <div className="grid gap-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="rounded-full bg-muted p-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Job Number</p>
                  <p className="text-sm font-medium">{job.job_number}</p>
                </div>
              </div>
              {job.booking_date && (
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="rounded-full bg-muted p-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Booking Date</p>
                    <p className="text-sm font-medium">
                      {format(new Date(job.booking_date), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              )}
              {job.delivery_date && (
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="rounded-full bg-muted p-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Delivery Date</p>
                    <p className="text-sm font-medium">
                      {format(new Date(job.delivery_date), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              )}
              {job.material_type && (
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="rounded-full bg-muted p-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Material Type</p>
                    <p className="text-sm">{job.material_type}</p>
                  </div>
                </div>
              )}
              {job.special_requirements && (
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="rounded-full bg-muted p-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Special Requirements</p>
                    <p className="text-sm whitespace-pre-wrap">{job.special_requirements}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Timeline Card */}
        {job.status && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Status Timeline</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
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
          <Separator />
          <CardContent className="pt-6">
            {(job.before_photos?.length || 0) > 0 && (job.after_photos?.length || 0) > 0 ? (
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
              <JobPhotoViewer
                photos={job.after_photos}
                title="After Photos"
              />
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <AllPhotosDialog
        job={job}
        open={photosDialogOpen}
        onOpenChange={setPhotosDialogOpen}
      />
      <InvoiceDialog
        invoiceUrl={job.invoice_file_path}
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
      />

      {/* After Photos Upload - Only show when status is in_progress or completed */}
      <AfterPhotosUpload job={job} onUpdate={onStatusUpdate} />

      {/* Invoice Upload - Only show when status is in_progress or completed */}
      <InvoiceUploadDetail 
        job={originalJob || job}
        displayJob={job}
        onUpdate={onStatusUpdate} 
      />

      {/* Invoice Display - Show if invoice exists and upload component is not shown */}
      {job.invoice_file_path && 
       job.status !== JOB_STATUS.IN_PROGRESS && 
       job.status !== JOB_STATUS.COMPLETED && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
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

// Export status card separately for use in page layout
export function JobStatusCard({
  job,
  onStatusUpdate,
  onSendEmail,
  isSendingEmail,
  whatsAppLink,
}: {
  job: Job;
  onStatusUpdate?: () => void;
  onSendEmail: () => void;
  isSendingEmail: boolean;
  whatsAppLink: string | null;
}) {
  return (
    <Card className="w-full lg:max-w-md">
      <CardHeader>
        <CardTitle>Status & Actions</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6 space-y-4">
        {job.status && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Current Status</p>
            <StatusBadge status={job.status as JobStatus} />
          </div>
        )}
        {job.status && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Update Status</p>
            <StatusUpdate
              currentStatus={job.status as JobStatus}
              jobId={job.id}
              onStatusUpdate={onStatusUpdate}
            />
          </div>
        )}
        <div className="flex flex-col gap-2 pt-2">
          {job.email && job.public_token && (
            <Button
              variant="outline"
              onClick={onSendEmail}
              disabled={isSendingEmail}
              className="w-full"
            >
              <Mail className="mr-2 h-4 w-4" />
              {isSendingEmail ? 'Sending...' : 'Send Email'}
            </Button>
          )}
          {whatsAppLink && (
            <Button variant="outline" asChild className="w-full">
              <a
                href={whatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Send WhatsApp Message
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
