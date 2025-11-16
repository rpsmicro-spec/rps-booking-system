"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, User, Phone, Mail, MapPin, UserCircle } from "lucide-react";
import { formatAddress } from "@/lib/utils/address";
import type { Job } from "@/types/types";

interface CustomerDetailsDialogProps {
  job: Job;
}

export function CustomerDetailsDialog({ job }: CustomerDetailsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Info className="mr-2 h-4 w-4" />
          View Customer Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle>Customer Information</DialogTitle>
          <DialogDescription>
            Complete customer details for this job
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 space-y-6">
          {/* Company Name */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-0.5">
              <div className="rounded-full bg-muted p-2">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Company Name</p>
              <p className="text-base font-semibold">{job.customer_name}</p>
            </div>
          </div>

          {/* Contact Person Name */}
          {(job as Job & { contact_person_name?: string }).contact_person_name && (
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-0.5">
                <div className="rounded-full bg-muted p-2">
                  <UserCircle className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Contact Person</p>
                <p className="text-base font-semibold break-words">
                  {(job as Job & { contact_person_name?: string }).contact_person_name}
                  {(job as Job & { contact_person_designation?: string }).contact_person_designation && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({(job as Job & { contact_person_designation?: string }).contact_person_designation})
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Contact Information */}
          {(job.contact_number || job.email) && (
            <div className="space-y-4">
              {job.contact_number && (
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="rounded-full bg-muted p-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Contact Number</p>
                    <p className="text-sm font-medium">{job.contact_number}</p>
                  </div>
                </div>
              )}
              {job.email && (
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="rounded-full bg-muted p-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Email Address</p>
                    <p className="text-sm font-medium break-all">{job.email}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Address */}
          {(() => {
            const address = formatAddress(job);
            return address ? (
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="rounded-full bg-muted p-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Address</p>
                  <p className="text-sm whitespace-pre-line leading-relaxed">{address}</p>
                </div>
              </div>
            ) : null;
          })()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

