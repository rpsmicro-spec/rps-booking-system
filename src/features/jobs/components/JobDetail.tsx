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
import { cn } from "@/lib/utils";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ShareJobButton } from "./ShareJobButton";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown } from "lucide-react";

// WhatsApp Icon Component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    className={cn("bi bi-whatsapp", className)}
    viewBox="0 0 16 16"
  >
    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
  </svg>
);
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
          <CardContent className="pt-4 px-4 pb-4">
            {job.status && (
              <div className="flex flex-col gap-3">
                <div className="w-full">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Update Status
                  </p>
                  <StatusUpdate
                    currentStatus={job.status as JobStatus}
                    jobId={job.id}
                    onStatusUpdate={onStatusUpdate}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {job.email && job.public_token && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEmailButtonClick}
                      disabled={isSendingEmail}
                      className="h-8 px-3"
                    >
                      <Mail className="h-3.5 w-3.5 mr-1.5" />
                      <span className="text-xs">
                        {isSendingEmail ? "Sending..." : "Email"}
                      </span>
                    </Button>
                  )}
                  {whatsAppLinks.length > 0 && (
                    <>
                      {whatsAppLinks.length === 1 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="h-8 px-3"
                        >
                          <a
                            href={whatsAppLinks[0].link || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <WhatsAppIcon className="h-3.5 w-3.5 mr-1.5" />
                            <span className="text-xs">WhatsApp</span>
                          </a>
                        </Button>
                      ) : (
                        whatsAppLinks.map((phoneData, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            asChild
                            className="h-8 px-3"
                          >
                            <a
                              href={phoneData.link || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <WhatsAppIcon className="h-3.5 w-3.5 mr-1.5" />
                              <span className="text-xs">{phoneData.label}</span>
                            </a>
                          </Button>
                        ))
                      )}
                    </>
                  )}
                  <ShareJobButton job={job} jobNumber={job.job_number} />
                  {hasPhotos && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPhotosDialogOpen(true)}
                      className="h-8 px-3"
                    >
                      {/* eslint-disable-next-line jsx-a11y/alt-text */}
                      <Image className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                      <span className="text-xs">Media</span>
                    </Button>
                  )}
                  {hasInvoice && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInvoiceDialogOpen(true)}
                      className="h-8 px-3"
                    >
                      <FileText className="h-3.5 w-3.5 mr-1.5" />
                      <span className="text-xs">Invoice</span>
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
    <div className="space-y-3 w-full">
      {/* Job Details and Status Timeline - Side by Side on Desktop */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Job Details Card */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-muted p-1.5">
                <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <CardTitle className="text-sm font-semibold">Job Details</CardTitle>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-3 px-4 pb-4">
            <div className="grid gap-3">
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <div className="rounded-full bg-muted p-1.5">
                    <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Job Number
                  </p>
                  <p className="text-sm font-medium wrap-break-word">
                    {job.job_number}
                  </p>
                </div>
              </div>
              {job.booking_date && (
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    <div className="rounded-full bg-muted p-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
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
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    <div className="rounded-full bg-muted p-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
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
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    <div className="rounded-full bg-muted p-1.5">
                      <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Customer DC Number
                    </p>
                    <p className="text-sm font-medium wrap-break-word">
                      {
                        (job as Job & { customer_dc_number?: string })
                          .customer_dc_number
                      }
                      {(job as Job & { customer_dc_date?: string })
                        .customer_dc_date && (
                        <span className="text-xs font-normal text-muted-foreground ml-1.5 block sm:inline">
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
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    <div className="rounded-full bg-muted p-1.5">
                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
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
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    <div className="rounded-full bg-muted p-1.5">
                      <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Contact Person
                    </p>
                    <p className="text-sm font-medium wrap-break-word">
                      {
                        (job as Job & { contact_person_name?: string })
                          .contact_person_name
                      }
                      {(job as Job & { contact_person_designation?: string })
                        .contact_person_designation && (
                        <span className="text-xs font-normal text-muted-foreground ml-1.5 block sm:inline">
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
                ((job as Job & { phone_numbers?: string[] }).phone_numbers
                  ?.length ?? 0) > 0) && (
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    <div className="rounded-full bg-muted p-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
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
                ((job as Job & { emails?: string[] }).emails?.length ?? 0) > 0) && (
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    <div className="rounded-full bg-muted p-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
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
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    <div className="rounded-full bg-muted p-1.5">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Special Requirements
                    </p>
                    <p className="text-sm whitespace-pre-wrap wrap-break-word">
                      {job.special_requirements}
                    </p>
                  </div>
                </div>
              )}
              {(job as Job & { notes?: string }).notes && (
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    <div className="rounded-full bg-muted p-1.5">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
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
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-muted p-1.5">
                  <Package className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <CardTitle className="text-sm font-semibold">
                  Status Timeline
                </CardTitle>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-3 px-4 pb-4">
              <StatusTimeline
                currentStatus={job.status as JobStatus}
                statusHistory={statusHistory}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Photos & Videos - Show before and after in tabs */}
      {((job.before_photos?.length ?? 0) > 0 || (job.after_photos?.length ?? 0) > 0) && (
        <Collapsible defaultOpen={false} className="rounded-lg border bg-card group">
          <CollapsibleTrigger className="w-full p-4 md:p-6 hover:bg-muted/50 active:bg-muted transition-colors touch-manipulation">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-muted p-1.5">
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                </div>
                <CardTitle className="text-sm font-semibold">Photos & Videos</CardTitle>
              </div>
              <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 shrink-0" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 md:px-6 pb-4 md:pb-6">
            {(job.before_photos?.length || 0) > 0 &&
            (job.after_photos?.length || 0) > 0 ? (
              <Tabs defaultValue="before" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="before" className="text-xs">
                    <span>Before</span>
                    {job.before_photos && job.before_photos.length > 0 && (
                      <span className="ml-1">
                        ({job.before_photos.length})
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="after" className="text-xs">
                    <span>After</span>
                    {job.after_photos && job.after_photos.length > 0 && (
                      <span className="ml-1">
                        ({job.after_photos.length})
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="before" className="mt-3">
                  <JobPhotoViewer
                    photos={job.before_photos || []}
                    title="Before"
                  />
                </TabsContent>
                <TabsContent value="after" className="mt-3">
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
          </CollapsibleContent>
        </Collapsible>
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
          <Collapsible defaultOpen={false} className="rounded-lg border bg-card group">
            <CollapsibleTrigger className="w-full p-4 md:p-6 hover:bg-muted/50 active:bg-muted transition-colors touch-manipulation">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-muted p-1.5">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Invoice</CardTitle>
                </div>
                <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 shrink-0" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 md:px-6 pb-4 md:pb-6">
              <PDFViewer
                url={job.invoice_file_path}
                title="Invoice PDF"
                showDownload={true}
              />
            </CollapsibleContent>
          </Collapsible>
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
      <CardHeader className="pb-1 pt-4 px-4">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-muted p-1.5">
            <Package className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-semibold">Status & Actions</CardTitle>
        </div>
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
                <WhatsAppIcon className="mr-2 h-4 w-4" />
                WhatsApp ({phoneData.label})
              </a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
