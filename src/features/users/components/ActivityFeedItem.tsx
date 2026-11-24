"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Contact } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type AuditLog,
  formatActionLabel,
  formatIstDateTime,
  formatIstTime,
  getActionVisual,
  getActorName,
  getChangedKeys,
  getDetailRows,
  getCustomerLink,
  getJobHref,
  roleLabel,
  statusLabel,
  str,
  summarizeKeys,
} from "./activity-format";

function Strong({ children }: { children: ReactNode }) {
  return <span className="font-medium text-foreground">{children}</span>;
}

/** One readable sentence plus an optional muted secondary line. */
function describe(log: AuditLog): { sentence: ReactNode; meta?: string } {
  const d = log.details || {};
  const actor = <Strong>{getActorName(log)}</Strong>;
  const job = str(d.job_number);
  const jobHref = getJobHref(log);
  const jobRef = !job ? (
    "a job"
  ) : jobHref ? (
    <Link
      href={jobHref}
      className="font-medium whitespace-nowrap text-foreground underline decoration-muted-foreground/40 underline-offset-2 hover:decoration-foreground"
    >
      {job}
    </Link>
  ) : (
    <span className="font-medium whitespace-nowrap text-foreground">{job}</span>
  );

  switch (log.action) {
    case "job.created":
      return { sentence: <>{actor} created job {jobRef}</> };
    case "job.updated": {
      const keys = getChangedKeys(log);
      return {
        sentence: <>{actor} updated job {jobRef}</>,
        meta: keys.length ? `Changed ${summarizeKeys(keys)}` : undefined,
      };
    }
    case "job.deleted":
      return { sentence: <>{actor} deleted job {jobRef}</> };
    case "job.status_changed":
      return {
        sentence: (
          <>
            {actor} moved job {jobRef} from <Strong>{statusLabel(d.old_status)}</Strong> to{" "}
            <Strong>{statusLabel(d.new_status)}</Strong>
          </>
        ),
      };
    case "customer.updated": {
      const oldName = str(d.old_customer_name);
      const newName = str(d.new_customer_name);
      const count = typeof d.updated_jobs === "number" ? d.updated_jobs : 0;
      const meta = count > 0 ? `${count} job${count === 1 ? "" : "s"} updated` : undefined;
      if (oldName && newName && oldName !== newName) {
        return {
          sentence: (
            <>
              {actor} renamed customer <Strong>{oldName}</Strong> to <Strong>{newName}</Strong>
            </>
          ),
          meta,
        };
      }
      return {
        sentence: <>{actor} updated customer <Strong>{newName ?? oldName ?? "details"}</Strong></>,
        meta,
      };
    }
    case "user.created": {
      const email = str(d.email) ?? str(d.user_email);
      return {
        sentence: email ? <>{actor} added user <Strong>{email}</Strong></> : <>{actor} added a user</>,
      };
    }
    case "user.updated": {
      const email = str(d.updated_user_email);
      const keys = getChangedKeys(log);
      return {
        sentence: email ? <>{actor} updated user <Strong>{email}</Strong></> : <>{actor} updated a user</>,
        meta: keys.length ? `Changed ${summarizeKeys(keys)}` : undefined,
      };
    }
    case "user.deleted": {
      const email = str(d.deleted_user_email);
      return {
        sentence: email ? <>{actor} removed user <Strong>{email}</Strong></> : <>{actor} removed a user</>,
      };
    }
    case "user.role_changed": {
      const email = str(d.user_email);
      return {
        sentence: (
          <>
            {actor} changed the role of {email ? <Strong>{email}</Strong> : "a user"}
            {str(d.old_role) ? <> from <Strong>{roleLabel(d.old_role)}</Strong></> : null} to{" "}
            <Strong>{roleLabel(d.new_role)}</Strong>
          </>
        ),
      };
    }
    case "invite.sent": {
      const email = str(d.invited_email) ?? "someone";
      const role = str(d.invited_role);
      return {
        sentence: (
          <>
            {actor} invited <Strong>{email}</Strong>
            {role ? <> as <Strong>{roleLabel(role)}</Strong></> : null}
          </>
        ),
      };
    }
    case "invite.accepted": {
      const email = str(d.invited_email) ?? str(d.email) ?? str(d.user_email);
      return {
        sentence: email ? <><Strong>{email}</Strong> accepted their invite</> : <>{actor} accepted an invite</>,
      };
    }
    case "invite.expired": {
      const email = str(d.invited_email) ?? str(d.email);
      return {
        sentence: email ? <>Invite for <Strong>{email}</Strong> expired</> : <>An invite expired</>,
      };
    }
    default:
      if (/login|sign_?in/.test(log.action)) return { sentence: <>{actor} signed in</> };
      if (/logout|sign_?out/.test(log.action)) return { sentence: <>{actor} signed out</> };
      return {
        sentence: (
          <>
            {actor} · {formatActionLabel(log.action)}
          </>
        ),
        meta: log.resource_type ? formatActionLabel(log.resource_type) : undefined,
      };
  }
}

interface ActivityFeedItemProps {
  log: AuditLog;
  expanded: boolean;
  onExpandedChange: (open: boolean) => void;
  showRaw: boolean;
  onShowRawChange: (show: boolean) => void;
}

export function ActivityFeedItem({
  log,
  expanded,
  onExpandedChange,
  showRaw,
  onShowRawChange,
}: ActivityFeedItemProps) {
  const visual = getActionVisual(log.action);
  const Icon = visual.icon;
  const { sentence, meta } = describe(log);
  const customer = getCustomerLink(log);
  const hasDetails = !!log.details && Object.keys(log.details).length > 0;
  const rows = expanded ? getDetailRows(log) : [];
  const detailsId = `activity-details-${log.id}`;


  return (
    <li className="flex gap-3 px-3 py-3 md:px-4">
      <span
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
          visual.className,
        )}
        aria-hidden
      >
        <Icon className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3">
          <p className="min-w-0 flex-1 text-sm text-muted-foreground wrap-anywhere">
            {sentence}
          </p>
          <time
            dateTime={log.created_at}
            title={formatIstDateTime(log.created_at)}
            className="shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground"
          >
            {formatIstTime(log.created_at)}
          </time>
        </div>

        {(customer || meta || hasDetails) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground">
            {customer && (
              <Link
                href={customer.href}
                className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-md border bg-background px-1.5 py-0.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Contact className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{customer.label}</span>
              </Link>
            )}
            {meta && <span className="min-w-0 wrap-anywhere">{meta}</span>}
            {hasDetails && (
              <Button
                variant="ghost"
                size="sm"
                className="-mx-1.5 -my-1 h-auto gap-1 px-1.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:text-foreground"
                onClick={() => onExpandedChange(!expanded)}
                aria-expanded={expanded}
                aria-controls={detailsId}
              >
                Details
                <ChevronDown
                  className={cn("size-3.5 transition-transform", expanded && "rotate-180")}
                />
              </Button>
            )}
          </div>
        )}

        {expanded && hasDetails && (
          <div id={detailsId} className="mt-2 min-w-0 rounded-lg bg-muted/50 p-3">
            {rows.length > 0 && (
              <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:gap-y-2 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
                {rows.map((row) => (
                  <div key={row.key} className="min-w-0 space-y-0.5 sm:contents sm:space-y-0">
                    <dt className="min-w-0 text-xs text-muted-foreground sm:pt-px">{row.label}</dt>
                    <dd className="min-w-0 text-sm wrap-anywhere">
                      {row.from !== undefined ? (
                        <span className="inline-flex flex-wrap items-center gap-x-1.5">
                          <span className="text-muted-foreground">
                            {row.from}
                          </span>
                          <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-label="to" />
                          <span>{row.to}</span>
                        </span>
                      ) : (
                        row.to
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="mt-2 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="-mb-1 -mr-1 h-auto px-1.5 py-1 text-xs font-medium text-muted-foreground hover:bg-background hover:text-foreground"
                onClick={() => onShowRawChange(!showRaw)}
                aria-expanded={showRaw}
              >
                {showRaw ? "Hide raw" : "Raw"}
              </Button>
            </div>
            {showRaw && (
              <pre className="mt-1 max-h-60 min-w-0 overflow-auto whitespace-pre-wrap wrap-anywhere rounded-md bg-background p-2 font-mono text-xs text-muted-foreground">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
