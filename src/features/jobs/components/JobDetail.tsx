"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "./StatusBadge";
import { JobPhotoViewer } from "./JobPhotoViewer";
import { StatusTimeline, type StatusHistory } from "./StatusTimeline";
import { StatusUpdate } from "./StatusUpdate";
import { format } from "date-fns";
import { utcToIstDateObject } from "@/lib/utils/date-ist";
import type { Job, JobStatus } from "@/types/types";
import {
  MessageCircle,
  Mail,
  Hash,
  Calendar,
  Package,
  FileText,
  Image,
  UserCircle,
  ClipboardList,
  Phone,
} from "lucide-react";
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
import { ShareJobButton } from "./ShareJobButton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [ccAdditionalEmails, setCcAdditionalEmails] = useState(false);

  // Check if there are additional emails
  const hasAdditionalEmails =
    (job as Job & { emails?: string[] }).emails?.filter((e) => e.trim() !== "")
      .length > 0;

  // Generate WhatsApp message to customer based on current status
  const getWhatsAppMessageToCustomer = () => {
    if (!job.status) return null;

    const viewLink = getJobViewUrl(job);
    const statusLabel = STATUS_LABELS[job.status as JobStatus] || "Unknown";

    if (job.status === JOB_STATUS.COMPLETED) {
      return generateCompletionMessageToCustomer(job, viewLink);
    } else {
      return generateStatusUpdateMessageToCustomer(job, statusLabel, viewLink);
    }
  };

  // Get all phone numbers with labels (primary + additional)
  const getAllPhoneNumbers = () => {
    const phoneNumbers: Array<{ number: string; label: string }> = [];
    
    // Add primary phone number
    if (job.contact_number && job.contact_number.trim() !== "") {
      phoneNumbers.push({
        number: job.contact_number,
        label: "Primary",
      });
    }
    
    // Add additional phone numbers
    const additionalPhones = (job as Job & { phone_numbers?: string[] }).phone_numbers || [];
    additionalPhones
      .filter((phone) => phone && phone.trim() !== "")
      .forEach((phone, index) => {
        phoneNumbers.push({
          number: phone,
          label: `Additional #${index + 1}`,
        });
      });
    
    return phoneNumbers;
  };

  // Generate WhatsApp links for all phone numbers
  const whatsAppMessage = getWhatsAppMessageToCustomer();
  const allPhoneNumbers = getAllPhoneNumbers();
  const whatsAppLinks = whatsAppMessage
    ? allPhoneNumbers.map((phoneData) => ({
        ...phoneData,
        link: getCustomerWhatsAppLink(phoneData.number, whatsAppMessage),
      }))
    : [];

  const handleSendEmail = async (withCC: boolean = false) => {
    if (!job.email || !job.public_token) {
      toast.error("Job does not have customer email or public token");
      return;
    }

    setIsSendingEmail(true);
    setEmailDialogOpen(false);
    try {
      const notificationType =
        job.status === JOB_STATUS.COMPLETED ? "completion" : "status_change";
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          notificationType,
          ccAdditionalEmails: withCC,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to send email");
        return;
      }

      toast.success(
        withCC && hasAdditionalEmails
          ? "Email sent successfully (CC'd to additional emails)"
          : "Email sent successfully"
      );
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSendingEmail(false);
      setCcAdditionalEmails(false); // Reset checkbox
    }
  };

  const handleEmailButtonClick = () => {
    if (hasAdditionalEmails) {
      // Show dialog with CC option
      setEmailDialogOpen(true);
    } else {
      // Send directly without CC option
      handleSendEmail(false);
    }
  };

  // If only showing status card, return just that
  if (renderStatusCard && showStatusActions) {
    const hasPhotos =
      (job.before_photos?.length || 0) + (job.after_photos?.length || 0) > 0;
    const hasInvoice = !!job.invoice_file_path;

    return (
      <>
        <Card className="w-full">
          <CardContent className="pt-4 sm:pt-6">
            {job.status && (
              <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-3 sm:gap-4">
                <div className="w-full lg:flex-1 lg:min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Update Status
                  </p>
                  <StatusUpdate
                    currentStatus={job.status as JobStatus}
                    jobId={job.id}
                    onStatusUpdate={onStatusUpdate}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-2 w-full lg:w-auto lg:shrink-0 lg:items-center">
                  {job.email && job.public_token && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEmailButtonClick}
                      disabled={isSendingEmail}
                      className="w-full lg:w-auto"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">
                        {isSendingEmail ? "Sending..." : "Send Email"}
                      </span>
                      <span className="sm:hidden">
                        {isSendingEmail ? "Sending..." : "Email"}
                      </span>
                    </Button>
                  )}
                  {whatsAppLinks.length > 0 && (
                    <div className="flex flex-col gap-2 w-full lg:w-auto">
                      {whatsAppLinks.length === 1 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="w-full lg:w-auto"
                        >
                          <a
                            href={whatsAppLinks[0].link || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">
                              Send WhatsApp Message
                            </span>
                            <span className="sm:hidden">WhatsApp</span>
                          </a>
                        </Button>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {whatsAppLinks.map((phoneData, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              asChild
                              className="w-full lg:w-auto text-xs"
                            >
                              <a
                                href={phoneData.link || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <MessageCircle className="mr-2 h-3.5 w-3.5" />
                                <span className="hidden sm:inline">
                                  WhatsApp ({phoneData.label})
                                </span>
                                <span className="sm:hidden">
                                  {phoneData.label}
                                </span>
                              </a>
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <ShareJobButton job={job} jobNumber={job.job_number} />
                  {hasPhotos && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPhotosDialogOpen(true)}
                      className="w-full lg:w-auto"
                    >
                      {/* eslint-disable-next-line jsx-a11y/alt-text */}
                      <Image className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">View All Media</span>
                      <span className="sm:hidden">Media</span>
                    </Button>
                  )}
                  {hasInvoice && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInvoiceDialogOpen(true)}
                      className="w-full lg:w-auto"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">View Invoice</span>
                      <span className="sm:hidden">Invoice</span>
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
        
        {/* Email CC Dialog */}
        <AlertDialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Send Email Notification</AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <div>
                  Send email notification to: <strong>{job.email}</strong>
                </div>
                {hasAdditionalEmails && (
                  <div className="flex items-start gap-2 pt-2">
                    <Checkbox
                      id="cc-emails"
                      checked={ccAdditionalEmails}
                      onCheckedChange={(checked) =>
                        setCcAdditionalEmails(checked as boolean)
                      }
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="cc-emails"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Also send to additional email addresses (CC)
                      </label>
                      <div className="text-xs text-muted-foreground mt-1">
                        {(job as Job & { emails?: string[] }).emails
                          ?.filter((e) => e.trim() !== "")
                          .join(", ")}
                      </div>
                    </div>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSendingEmail}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleSendEmail(ccAdditionalEmails)}
                disabled={isSendingEmail}
              >
                {isSendingEmail ? "Sending..." : "Send Email"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Otherwise, show the rest of the content
  return (
    <div className="space-y-3 sm:space-y-4 w-full">
      {/* Job Details and Status Timeline - Side by Side on Desktop */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        {/* Job Details Card */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">Job Details</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 sm:pt-6">
            <div className="grid gap-4 sm:gap-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="shrink-0 mt-0.5">
                  <div className="rounded-full bg-muted p-1.5 sm:p-2">
                    <Hash className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1 sm:mb-1.5">
                    Job Number
                  </p>
                  <p className="text-sm font-medium wrap-break-word">
                    {job.job_number}
                  </p>
                </div>
              </div>
              {job.booking_date && (
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="shrink-0 mt-0.5">
                    <div className="rounded-full bg-muted p-1.5 sm:p-2">
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1 sm:mb-1.5">
                      Booking Date
                    </p>
                    <p className="text-sm font-medium">
                      {(() => {
                        const istDate = utcToIstDateObject(job.booking_date);
                        return istDate ? format(istDate, "MMM dd, yyyy") : "";
                      })()}
                    </p>
                  </div>
                </div>
              )}
              {job.delivery_date && (
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="shrink-0 mt-0.5">
                    <div className="rounded-full bg-muted p-1.5 sm:p-2">
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1 sm:mb-1.5">
                      Delivery Date
                    </p>
                    <p className="text-sm font-medium">
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
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="shrink-0 mt-0.5">
                    <div className="rounded-full bg-muted p-1.5 sm:p-2">
                      <ClipboardList className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1 sm:mb-1.5">
                      Customer DC Number
                    </p>
                    <p className="text-sm font-medium wrap-break-word">
                      {
                        (job as Job & { customer_dc_number?: string })
                          .customer_dc_number
                      }
                      {(job as Job & { customer_dc_date?: string })
                        .customer_dc_date && (
                        <span className="text-xs font-normal text-muted-foreground ml-1.5 sm:ml-2 block sm:inline">
                          •{" "}
                          {(() => {
                            const dcDate = (job as Job & { customer_dc_date?: string })
                              .customer_dc_date;
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
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="shrink-0 mt-0.5">
                    <div className="rounded-full bg-muted p-1.5 sm:p-2">
                      <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1 sm:mb-1.5">
                      Material Type
                    </p>
                    <p className="text-sm wrap-break-word">
                      {job.material_type}
                    </p>
                  </div>
                </div>
              )}
              {(job as Job & { contact_person_name?: string })
                .contact_person_name && (
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="shrink-0 mt-0.5">
                    <div className="rounded-full bg-muted p-1.5 sm:p-2">
                      <UserCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1 sm:mb-1.5">
                      Contact Person
                    </p>
                    <p className="text-sm font-medium wrap-break-word">
                      {
                        (job as Job & { contact_person_name?: string })
                          .contact_person_name
                      }
                      {(job as Job & { contact_person_designation?: string })
                        .contact_person_designation && (
                        <span className="text-xs font-normal text-muted-foreground ml-1.5 sm:ml-2 block sm:inline">
                          (
                          {
                            (
                              job as Job & {
                                contact_person_designation?: string;
                              }
                            ).contact_person_designation
                          }
                          )
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
              {/* Phone Numbers Section */}
              {(job.contact_number ||
                (job as Job & { phone_numbers?: string[] }).phone_numbers
                  ?.length) && (
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="shrink-0 mt-0.5">
                    <div className="rounded-full bg-muted p-1.5 sm:p-2">
                      <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1 sm:mb-1.5">
                      Phone Numbers
                    </p>
                    <div className="space-y-1.5">
                      {job.contact_number && (
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium wrap-break-word">
                            {job.contact_number}
                          </p>
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            Primary
                          </span>
                        </div>
                      )}
                      {(job as Job & { phone_numbers?: string[] }).phone_numbers
                        ?.filter((phone) => phone.trim() !== "")
                        .map((phone, index) => (
                          <p
                            key={index}
                            className="text-sm text-muted-foreground wrap-break-word"
                          >
                            {phone}
                          </p>
                        ))}
                    </div>
                  </div>
                </div>
              )}
              {/* Email Addresses Section */}
              {(job.email ||
                (job as Job & { emails?: string[] }).emails?.length) && (
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="shrink-0 mt-0.5">
                    <div className="rounded-full bg-muted p-1.5 sm:p-2">
                      <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1 sm:mb-1.5">
                      Email Addresses
                    </p>
                    <div className="space-y-1.5">
                      {job.email && (
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium wrap-break-word break-all">
                            {job.email}
                          </p>
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">
                            Primary
                          </span>
                        </div>
                      )}
                      {(job as Job & { emails?: string[] }).emails
                        ?.filter((email) => email.trim() !== "")
                        .map((email, index) => (
                          <p
                            key={index}
                            className="text-sm text-muted-foreground wrap-break-word break-all"
                          >
                            {email}
                          </p>
                        ))}
                    </div>
                  </div>
                </div>
              )}
              {job.special_requirements && (
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="shrink-0 mt-0.5">
                    <div className="rounded-full bg-muted p-1.5 sm:p-2">
                      <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1 sm:mb-1.5">
                      Special Requirements
                    </p>
                    <p className="text-sm whitespace-pre-wrap wrap-break-word">
                      {job.special_requirements}
                    </p>
                  </div>
                </div>
              )}
              {(job as Job & { notes?: string }).notes && (
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="shrink-0 mt-0.5">
                    <div className="rounded-full bg-muted p-1.5 sm:p-2">
                      <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1 sm:mb-1.5">
                      Internal Notes
                    </p>
                    <p className="text-sm whitespace-pre-wrap wrap-break-word">
                      {(job as Job & { notes?: string }).notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Timeline Card */}
        {job.status && (
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">
                Status Timeline
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 sm:pt-6">
              <StatusTimeline
                currentStatus={job.status as JobStatus}
                statusHistory={statusHistory}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Photos & Videos - Show before and after in tabs */}
      {(job.before_photos?.length || job.after_photos?.length) && (
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">Photos & Videos</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 sm:pt-6">
            {(job.before_photos?.length || 0) > 0 &&
            (job.after_photos?.length || 0) > 0 ? (
              <Tabs defaultValue="before" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="before" className="text-xs sm:text-sm">
                    <span className="hidden sm:inline">Before</span>
                    <span className="sm:hidden">Before</span>
                    <span className="ml-1">
                      ({job.before_photos?.length || 0})
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="after" className="text-xs sm:text-sm">
                    <span className="hidden sm:inline">After</span>
                    <span className="sm:hidden">After</span>
                    <span className="ml-1">
                      ({job.after_photos?.length || 0})
                    </span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="before" className="mt-3 sm:mt-4">
                  <JobPhotoViewer
                    photos={job.before_photos || []}
                    title="Before"
                  />
                </TabsContent>
                <TabsContent value="after" className="mt-3 sm:mt-4">
                  <JobPhotoViewer
                    photos={job.after_photos || []}
                    title="After"
                  />
                </TabsContent>
              </Tabs>
            ) : job.before_photos && job.before_photos.length > 0 ? (
              <JobPhotoViewer
                photos={job.before_photos}
                title="Before"
              />
            ) : job.after_photos && job.after_photos.length > 0 ? (
              <JobPhotoViewer photos={job.after_photos} title="After" />
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
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Invoice</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 sm:pt-6">
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
  whatsAppLinks,
}: {
  job: Job;
  onStatusUpdate?: () => void;
  onSendEmail: () => void;
  isSendingEmail: boolean;
  whatsAppLinks: Array<{ number: string; label: string; link: string | null }>;
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
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Current Status
            </p>
            <StatusBadge status={job.status as JobStatus} />
          </div>
        )}
        {job.status && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Update Status
            </p>
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
              {isSendingEmail ? "Sending..." : "Send Email"}
            </Button>
          )}
          {whatsAppLinks.map((phoneData, index) => (
            <Button
              key={index}
              variant="outline"
              asChild
              className="w-full"
            >
              <a
                href={phoneData.link || "#"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp ({phoneData.label})
              </a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
