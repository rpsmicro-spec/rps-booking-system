"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  jobs: "Jobs",
  new: "New Job",
  edit: "Edit",
  users: "Users",
  invite: "Invite User",
  customers: "Customers",
  activity: "Activity",
};

// Check if a string looks like a UUID
function isUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const [jobNumbers, setJobNumbers] = React.useState<Record<string, string>>(
    {}
  );
  const [isMounted, setIsMounted] = React.useState(false);

  // Ensure client-side only rendering to avoid hydration mismatch
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Split pathname into segments
  const segments = pathname.split("/").filter(Boolean);

  // Fetch job numbers for UUID segments
  React.useEffect(() => {
    const fetchJobNumbers = async () => {
      const uuidSegments = segments.filter(
        (seg, idx) => isUUID(seg) && segments[idx - 1] === "jobs"
      );

      if (uuidSegments.length === 0) return;

      const newJobNumbers: Record<string, string> = {};

      await Promise.all(
        uuidSegments.map(async (uuid) => {
          try {
            const response = await fetch(`/api/jobs/${uuid}`);
            if (response.ok) {
              const data = await response.json();
              if (data.job?.job_number) {
                newJobNumbers[uuid] = data.job.job_number;
              }
            }
          } catch {
            // Ignore errors
          }
        })
      );

      if (Object.keys(newJobNumbers).length > 0) {
        setJobNumbers((prev) => {
          // Only update if we have new job numbers
          const hasNew = Object.keys(newJobNumbers).some(
            (uuid) => !prev[uuid]
          );
          return hasNew ? { ...prev, ...newJobNumbers } : prev;
        });
      }
    };

    fetchJobNumbers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Build breadcrumb items
  const breadcrumbItems = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;
    
    // Check if this is a UUID for a job detail page
    let label: string;
    if (isUUID(segment) && segments[index - 1] === "jobs" && jobNumbers[segment]) {
      label = jobNumbers[segment];
    } else {
      label =
        routeLabels[segment] ||
        segment.charAt(0).toUpperCase() + segment.slice(1);
    }

    return {
      href,
      label,
      isLast,
    };
  });

  // Don't show breadcrumbs on dashboard (home)
  if (pathname === "/dashboard" || pathname === "/") {
    return null;
  }

  // Don't render until mounted to avoid hydration mismatch
  if (!isMounted) {
    return (
      <Breadcrumb className="min-w-0">
        <BreadcrumbList className="min-w-0">
          <BreadcrumbItem className="min-w-0 max-w-full">
            <BreadcrumbPage className="truncate">...</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="min-w-0">
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={item.href}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem className="min-w-0 max-w-full">
              {item.isLast ? (
                <BreadcrumbPage className="truncate">{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href} className="truncate block hover:text-foreground transition-colors">{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
