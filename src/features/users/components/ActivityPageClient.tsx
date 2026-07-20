"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  FileText,
  Clock,
  Info,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityFilters } from "./ActivityFilters";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { utcToIstDateObject } from "@/lib/utils/date-ist";
import { ROLE_LABELS } from "@/lib/constants/roles";
import type { UserRole } from "@/lib/constants/roles";

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  } | null;
}

const PAGE_SIZE = 20;
const MAX_SUMMARY_FIELDS = 4; // show first N field names before "and N more"

/** Snake_case / field key → human-readable label (e.g. address_area → Address area). */
function formatFieldLabel(key: string): string {
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/** Get changed field keys from job.updated details; optionally truncated for one-line summary. */
function getChangedFieldsSummary(
  log: AuditLog,
  options: { truncate?: boolean } = {}
): string {
  const d = log.details || {};
  const changes = d.changes as Record<string, unknown> | undefined;
  const keys =
    changes && typeof changes === "object" ? Object.keys(changes) : [];
  if (keys.length === 0) return "details";
  if (!options.truncate || keys.length <= MAX_SUMMARY_FIELDS) {
    return keys.map(formatFieldLabel).join(", ");
  }
  const shown = keys.slice(0, MAX_SUMMARY_FIELDS).map(formatFieldLabel);
  return `${shown.join(", ")} and ${keys.length - MAX_SUMMARY_FIELDS} more`;
}

/** Human-readable one-line summary for the activity (replaces raw JSON in main view). */
function getActivitySummary(log: AuditLog): string {
  const d = log.details || {};
  const jobNum = d.job_number as string | undefined;
  const customerName = d.customer_name as string | undefined;
  const jobPart = jobNum ? `#${jobNum}` : "";
  const customerPart = customerName ? ` · ${customerName}` : "";

  switch (log.action) {
    case "job.created":
      return jobPart ? `Job ${jobPart}${customerPart}` : "New job";
    case "job.updated": {
      const changed = getChangedFieldsSummary(log, { truncate: true });
      return jobPart
        ? `Job ${jobPart}${customerPart} · Updated: ${changed}`
        : `Job updated · ${changed}`;
    }
    case "job.deleted":
      return jobPart ? `Job ${jobPart}${customerPart}` : "Job deleted";
    case "job.status_changed": {
      const oldS = (d.old_status as string) || "?";
      const newS = (d.new_status as string) || "?";
      const statusPart = `${oldS} → ${newS}`;
      return jobPart
        ? `Job ${jobPart}${customerPart} · ${statusPart}`
        : statusPart;
    }
    case "customer.updated": {
      const oldName = (d.old_customer_name as string) || "?";
      const newName = (d.new_customer_name as string) || "?";
      const count = typeof d.updated_jobs === "number" ? d.updated_jobs : 0;
      return count > 0
        ? `${oldName} → ${newName} (${count} jobs)`
        : `${oldName} → ${newName}`;
    }
    case "user.updated": {
      const changes = d.changes as Record<string, unknown> | undefined;
      const keys =
        changes && typeof changes === "object" ? Object.keys(changes) : [];
      const what =
        keys.length > MAX_SUMMARY_FIELDS
          ? `${keys.slice(0, MAX_SUMMARY_FIELDS).map(formatFieldLabel).join(", ")} and ${keys.length - MAX_SUMMARY_FIELDS} more`
          : keys.length > 0
            ? keys.map(formatFieldLabel).join(", ")
            : "details";
      const email = d.updated_user_email as string | undefined;
      return email ? `Updated ${what} for ${email}` : `Updated ${what}`;
    }
    case "user.deleted":
      return (d.deleted_user_email as string)
        ? `Removed ${d.deleted_user_email}`
        : "User removed";
    case "invite.sent": {
      const email = (d.invited_email as string) || "?";
      const role = d.invited_role as string | undefined;
      const roleLabel = role ? ROLE_LABELS[role as UserRole] || role : "";
      return roleLabel
        ? `Invited ${email} as ${roleLabel}`
        : `Invited ${email}`;
    }
    default:
      return log.resource_type ? `${log.resource_type}` : "—";
  }
}

/** Resource column: short label, optional link (e.g. to job), and type for badge. */
function getResourceLabel(log: AuditLog): {
  label: string;
  href?: string;
  typeLabel: string;
} {
  const d = log.details || {};
  if (log.resource_type === "job" && log.resource_id) {
    const jobNum = (d.job_number as string) || log.resource_id;
    const customerName = d.customer_name as string | undefined;
    const label = customerName
      ? `Job #${jobNum} · ${customerName}`
      : `Job #${jobNum}`;
    return { label, href: `/jobs/${log.resource_id}`, typeLabel: "Job" };
  }
  if (log.resource_type === "user") {
    const email =
      (d.updated_user_email as string) ||
      (d.deleted_user_email as string) ||
      "User";
    return { label: email, typeLabel: "User" };
  }
  if (log.resource_type === "customer") {
    const name =
      (d.new_customer_name as string) ||
      (d.old_customer_name as string) ||
      "Customer";
    return { label: name, typeLabel: "Customer" };
  }
  if (log.action === "invite.sent") {
    const email = (d.invited_email as string) || "Invitation";
    return { label: email, typeLabel: "Invite" };
  }
  const typeLabel =
    log.resource_type &&
    log.resource_type.charAt(0).toUpperCase() + log.resource_type.slice(1);
  return { label: log.resource_type || "—", typeLabel: typeLabel || "—" };
}

export function ActivityPageClient() {
  const isMobile = useIsMobile();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [expandedTechnicalId, setExpandedTechnicalId] = useState<string | null>(null);

  // Filters are applied server-side; changing one restarts from page 1.
  useEffect(() => {
    setCurrentPage(1);
  }, [search, dateFrom, dateTo]);

  useEffect(() => {
    // Debounce search keystrokes and abort superseded requests so a slow
    // older response can't overwrite the results of a newer one.
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => fetchAuditLogs(controller.signal),
      search ? 300 : 0,
    );
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, dateFrom, dateTo, currentPage]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = (currentPage - 1) * PAGE_SIZE;

  const fetchAuditLogs = async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      params.append("limit", PAGE_SIZE.toString());
      params.append("offset", ((currentPage - 1) * PAGE_SIZE).toString());

      const response = await fetch(`/api/audit-log?${params.toString()}`, {
        signal,
      });
      const result = await response.json();

      if (!response.ok) {
        console.error(result.error || "Failed to fetch audit logs");
        return;
      }

      const newTotal = result.total || 0;
      setLogs(result.logs || []);
      setTotal(newTotal);
      // Clamp the page if the total shrank under us (e.g. filters narrowed
      // while sitting on a late page).
      const lastPage = Math.max(1, Math.ceil(newTotal / PAGE_SIZE));
      if (currentPage > lastPage) {
        setCurrentPage(lastPage);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      console.error("An unexpected error occurred", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAction = (action: string) => {
    return action
      .split(/[._]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const getActionColor = (action: string) => {
    if (action.includes("created")) return "default";
    if (action.includes("updated")) return "outline";
    if (action.includes("deleted")) return "destructive";
    if (action.includes("invite")) return "outline";
    return "outline";
  };

  const handleClear = () => {
    setSearch("");
    setDateFrom(null);
    setDateTo(null);
  };

  const emptyState = (
    <div className="p-8 sm:p-12">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileText className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>No Activity Logs</EmptyTitle>
          <EmptyDescription>
            No system activity has been recorded yet. Activity will appear here
            as users interact with the system.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );

  return (
    <div className="flex-1 space-y-4 sm:space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Activity Log
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          View and track all system activities and user actions.
        </p>
      </div>

      <ActivityFilters
        search={search}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onSearchChange={setSearch}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onClear={handleClear}
      />

      <div className="space-y-4">
        <div>
          {isLoading ? (
            isMobile ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-40" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : logs.length === 0 ? (
            emptyState
          ) : isMobile ? (
            // Mobile Card View – lead with what happened, then meta; only technical details collapsible
            <div className="space-y-3">
              {logs.map((log) => {
                const istDate = utcToIstDateObject(log.created_at);
                const res = getResourceLabel(log);
                const summary = getActivitySummary(log);
                const actor = log.user
                  ? log.user.name || log.user.email
                  : "System";
                return (
                <Card key={log.id} className="border-l-4 border-l-primary/20">
                  <CardContent className="pt-4">
                    <div className="space-y-2.5 min-w-0 overflow-hidden">
                      {/* Badge above summary */}
                      <Badge
                        variant={getActionColor(log.action)}
                        className="text-xs shrink-0 w-fit"
                      >
                        {formatAction(log.action)}
                      </Badge>
                      <p
                        className="text-sm text-foreground truncate min-w-0"
                        title={summary}
                      >
                        {summary}
                      </p>

                      {/* Meta: when · who (single line, subtle pill so it reads as one block) */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap rounded-md bg-muted/50 px-2 py-1.5 w-fit">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {istDate
                            ? format(istDate, "MMM d, yyyy HH:mm")
                            : ""}
                        </span>
                        <span className="shrink-0">·</span>
                        <span className="truncate">{actor}</span>
                      </div>

                      {/* Resource: label (link when applicable) */}
                      {(res.label && res.label !== "—") && (
                        <div className="flex min-w-0 items-center gap-2 text-xs overflow-hidden">
                          {res.href ? (
                            <Link
                              href={res.href}
                              className="text-primary hover:underline truncate min-w-0 inline-flex items-center gap-1"
                              title={res.label}
                            >
                              <Info className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{res.label}</span>
                            </Link>
                          ) : (
                            <span className="text-muted-foreground truncate min-w-0 inline-flex items-center gap-1" title={res.label}>
                              <Info className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{res.label}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Updated fields (job.updated) – wrapped pills */}
                      {log.action === "job.updated" && (() => {
                        const d = log.details || {};
                        const changes = d.changes as Record<string, unknown> | undefined;
                        const keys = changes && typeof changes === "object" ? Object.keys(changes) : [];
                        if (keys.length === 0) return null;
                        return (
                          <div className="flex flex-wrap gap-1.5 min-w-0">
                            <span className="text-xs text-muted-foreground shrink-0 w-full">Updated fields:</span>
                            {keys.map((k) => (
                              <span
                                key={k}
                                className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                              >
                                {formatFieldLabel(k)}
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                      {/* Technical details – only this part is collapsible */}
                      {log.details && Object.keys(log.details).length > 0 && (
                        <Collapsible
                          open={expandedTechnicalId === log.id}
                          onOpenChange={(open) =>
                            setExpandedTechnicalId(open ? log.id : null)
                          }
                        >
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 mt-1 px-0 text-xs text-muted-foreground"
                            >
                              {expandedTechnicalId === log.id ? (
                                <ChevronDown className="h-3.5 w-3.5 mr-1" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 mr-1" />
                              )}
                              {expandedTechnicalId === log.id ? "Hide" : "View"}{" "}
                              technical details
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <pre className="mt-2 text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded break-words whitespace-pre-wrap overflow-auto max-h-40 min-w-0 max-w-full">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  </CardContent>
                </Card>
                );
              })}
              {total > PAGE_SIZE && (
                <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {start + 1}-
                    {Math.min(start + PAGE_SIZE, total)} of{" "}
                    {total} activities
                  </p>
                  <div className="flex w-full gap-2 sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-0 sm:flex-initial"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-0 sm:flex-initial"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Desktop Table View - collapsible rows, no Summary column
            <div className="space-y-4">
              <div className="min-w-0 rounded-md border overflow-hidden">
                <Table className="table-fixed w-full max-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-9" aria-label="Expand" />
                      <TableHead>Date & Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const resource = getResourceLabel(log);
                      const summary = getActivitySummary(log);
                      const hasDetails =
                        log.details && Object.keys(log.details).length > 0;
                      const isRowExpanded = expandedRowId === log.id;
                      return (
                        <Fragment key={log.id}>
                          <TableRow className="align-top">
                            <TableCell className="w-9 p-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={() =>
                                  setExpandedRowId(isRowExpanded ? null : log.id)
                                }
                                aria-expanded={isRowExpanded}
                                aria-label={isRowExpanded ? "Collapse row" : "Expand row"}
                              >
                                {isRowExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {(() => {
                                const istDate = utcToIstDateObject(
                                  log.created_at,
                                );
                                return istDate
                                  ? format(istDate, "MMM dd, yyyy HH:mm")
                                  : "";
                              })()}
                            </TableCell>
                            <TableCell>
                              {log.user ? (
                                <div>
                                  <div className="font-medium">
                                    {log.user.name || log.user.email}
                                  </div>
                                  {log.user.name && (
                                    <div className="text-sm text-muted-foreground">
                                      {log.user.email}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">
                                  System
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getActionColor(log.action)}>
                                {formatAction(log.action)}
                              </Badge>
                            </TableCell>
                            <TableCell className="min-w-0 max-w-[200px] sm:max-w-[280px]">
                              <div className="flex min-w-0 flex-wrap items-center gap-2">
                                {resource.href ? (
                                  <Link
                                    href={resource.href}
                                    className="text-sm text-primary hover:underline truncate min-w-0 inline-block max-w-full"
                                    title={resource.label}
                                  >
                                    {resource.label}
                                  </Link>
                                ) : (
                                  <span
                                    className="text-sm text-muted-foreground truncate min-w-0 inline-block max-w-full"
                                    title={resource.label}
                                  >
                                    {resource.label}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                          {isRowExpanded && (
                            <TableRow key={`${log.id}-detail`}>
                              <TableCell
                                colSpan={5}
                                className="bg-muted/30 p-4 min-w-0 overflow-hidden"
                              >
                                <div className="space-y-3 min-w-0 max-w-full overflow-hidden">
                                  <p className="text-sm text-muted-foreground truncate" title={summary}>
                                    {summary}
                                  </p>
                                  {log.action === "job.updated" && (() => {
                                    const d = log.details || {};
                                    const changes = d.changes as Record<string, unknown> | undefined;
                                    const keys = changes && typeof changes === "object" ? Object.keys(changes) : [];
                                    if (keys.length === 0) return null;
                                    return (
                                      <div className="flex flex-wrap gap-1.5">
                                        <span className="text-xs text-muted-foreground shrink-0">Updated fields:</span>
                                        {keys.map((k) => (
                                          <span
                                            key={k}
                                            className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                                          >
                                            {formatFieldLabel(k)}
                                          </span>
                                        ))}
                                      </div>
                                    );
                                  })()}
                                  {hasDetails && (
                                    <Collapsible
                                      open={expandedTechnicalId === log.id}
                                      onOpenChange={(open) =>
                                        setExpandedTechnicalId(open ? log.id : null)
                                      }
                                    >
                                      <CollapsibleTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 px-2 text-xs text-muted-foreground"
                                        >
                                          {expandedTechnicalId === log.id ? (
                                            <ChevronDown className="h-3.5 w-3.5 mr-1" />
                                          ) : (
                                            <ChevronRight className="h-3.5 w-3.5 mr-1" />
                                          )}
                                          {expandedTechnicalId === log.id ? "Hide" : "View"} technical details
                                        </Button>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent>
                                        <pre className="mt-2 text-xs text-muted-foreground overflow-auto rounded bg-muted/50 p-2 max-h-40 font-mono whitespace-pre-wrap break-words min-w-0 max-w-full">
                                          {JSON.stringify(log.details, null, 2)}
                                        </pre>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {total > PAGE_SIZE && (
                <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {start + 1}-
                    {Math.min(start + PAGE_SIZE, total)} of{" "}
                    {total} activities
                  </p>
                  <div className="flex w-full gap-2 sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-0 sm:flex-initial"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-0 sm:flex-initial"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
