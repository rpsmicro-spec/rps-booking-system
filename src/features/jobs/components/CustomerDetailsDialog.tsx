"use client";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Info, User, Phone, Mail, MapPin, UserCircle } from "lucide-react";
import { formatAddress } from "@/lib/utils/address";
import type { Job } from "@/types/types";
import { useIsMobile } from "@/hooks/use-mobile";
import Link from "next/link";

interface CustomerDetailsDialogProps {
  job: Job;
}

export function CustomerDetailsDialog({ job }: CustomerDetailsDialogProps) {
  const isMobile = useIsMobile();
  const contactPersonName = (job as Job & { contact_person_name?: string }).contact_person_name;
  const contactPersonDesignation = (job as Job & { contact_person_designation?: string }).contact_person_designation;
  const phoneNumbers = (job as Job & { phone_numbers?: string[] }).phone_numbers || [];
  const emails = (job as Job & { emails?: string[] }).emails || [];
  const hasAdditionalPhones = phoneNumbers.filter((p) => p && p.trim() !== "").length > 0;
  const hasAdditionalEmails = emails.filter((e) => e && e.trim() !== "").length > 0;
  const address = formatAddress(job);

  const customerDetailHref = `/customers/${encodeURIComponent(job.customer_name)}`;

  if (!isMobile) {
    return (
      <Button variant="outline" size="sm" className="text-xs sm:text-sm" asChild>
        <Link href={customerDetailHref}>
          <Info className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">View Customer Details</span>
          <span className="sm:hidden">Customer</span>
        </Link>
      </Button>
    );
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs sm:text-sm">
          <Info className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">View Customer Details</span>
          <span className="sm:hidden">Customer</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[90vh] sm:!max-w-4xl">
        <div className="mx-auto w-full max-w-4xl">
          <DrawerHeader className="pt-4 pb-2 px-4">
            <DrawerTitle className="text-sm font-semibold">Customer Information</DrawerTitle>
          </DrawerHeader>
          <Separator />
          <div className="px-4 pb-4 pt-3 space-y-3 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Company Name */}
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="shrink-0 mt-0.5">
              <div className="rounded-full bg-muted p-1.5 sm:p-2">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1 sm:mb-1.5">
                Company Name
              </p>
              <p className="text-sm sm:text-base font-semibold wrap-break-word">
                {job.customer_name}
              </p>
            </div>
          </div>

          {/* Contact Person Name */}
          {contactPersonName && (
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
                <p className="text-sm sm:text-base font-semibold wrap-break-word">
                  {contactPersonName}
                  {contactPersonDesignation && (
                    <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-1.5 sm:ml-2 block sm:inline">
                      ({contactPersonDesignation})
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Phone Numbers Section */}
          {(job.contact_number || hasAdditionalPhones) && (
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium wrap-break-word">
                        {job.contact_number}
                      </p>
                      <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">
                        Primary
                      </span>
                    </div>
                  )}
                  {phoneNumbers
                    .filter((phone) => phone && phone.trim() !== "")
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
          {(job.email || hasAdditionalEmails) && (
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium wrap-break-word break-all">
                        {job.email}
                      </p>
                      <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">
                        Primary
                      </span>
                    </div>
                  )}
                  {emails
                    .filter((email) => email && email.trim() !== "")
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

          {/* Address */}
          {address && (
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="shrink-0 mt-0.5">
                <div className="rounded-full bg-muted p-1.5 sm:p-2">
                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1 sm:mb-1.5">
                  Address
                </p>
                <div className="text-sm leading-relaxed wrap-break-word">
                  {address.split('\n').map((line, index) => (
                    <p key={index} className={index > 0 ? 'mt-1' : ''}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

