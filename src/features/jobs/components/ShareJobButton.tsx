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
      // Prefer production URL from env, fallback to current origin
      // On mobile, window.location.origin might be localhost or IP, so we prefer env var
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

      const url = getJobViewUrl(job, baseUrl);

      // Validate URL is properly formatted
      try {
        new URL(url); // This will throw if URL is invalid
        return url;
      } catch {
        // If URL parsing fails, try to fix it
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          return `https://${url}`;
        }
        return url;
      }
    } catch (error) {
      console.error("Failed to generate public job URL:", error);
      toast.error("Job does not have a public link");
      return "";
    }
  };

  const handleShare = async () => {
    const url = getJobUrl();
    if (!url) return; // Exit if URL generation failed

    // Validate URL is absolute
    let absoluteUrl = url;
    try {
      new URL(url);
    } catch {
      // If invalid, try to make it absolute
      absoluteUrl = url.startsWith("http") ? url : `https://${url}`;
    }

    if (isMobile && navigator.share) {
      // Use native share sheet on mobile
      try {
        // Only include description in text, URL should be in url field only
        // This prevents the share sheet from combining text and URL when copying
        await navigator.share({
          title: `Job ${jobNumber}`,
          text: `View job details for ${jobNumber}`,
          url: absoluteUrl, // URL should be in url field only
        });
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing:", error);
          // Fallback to copy on mobile if share fails
          await copyToClipboard(absoluteUrl);
        }
      }
    } else {
      // Copy to clipboard on desktop
      await copyToClipboard(absoluteUrl);
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
      className="h-8 px-3"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 mr-1.5" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Share2 className="h-3.5 w-3.5 mr-1.5" />
          <span>Share</span>
        </>
      )}
    </Button>
  );
}
