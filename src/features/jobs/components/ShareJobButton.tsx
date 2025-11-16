"use client";

import { Button } from "@/components/ui/button";
import { Share2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { getJobViewUrl } from "@/lib/notifications/utils";
import type { Job } from "@/types/types";

interface ShareJobButtonProps {
  job: Job;
  jobNumber: string;
}

export function ShareJobButton({ job, jobNumber }: ShareJobButtonProps) {
  const isMobile = useIsMobile();
  const [copied, setCopied] = useState(false);

  const getJobUrl = () => {
    if (typeof window === "undefined") return "";
    try {
      return getJobViewUrl(job, window.location.origin);
    } catch (error) {
      console.error("Failed to generate public job URL:", error);
      toast.error("Job does not have a public link");
      return "";
    }
  };

  const handleShare = async () => {
    const url = getJobUrl();
    if (!url) return; // Exit if URL generation failed

    if (isMobile && navigator.share) {
      // Use native share sheet on mobile
      try {
        await navigator.share({
          title: `Job ${jobNumber}`,
          text: `View job details for ${jobNumber}`,
          url: url,
        });
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing:", error);
          // Fallback to copy on mobile if share fails
          await copyToClipboard(url);
        }
      }
    } else {
      // Copy to clipboard on desktop
      await copyToClipboard(url);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy link");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className="w-full lg:w-auto"
    >
      {copied ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Copied</span>
          <span className="sm:hidden">Copied</span>
        </>
      ) : (
        <>
          <Share2 className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Share Link</span>
          <span className="sm:hidden">Share</span>
        </>
      )}
    </Button>
  );
}
