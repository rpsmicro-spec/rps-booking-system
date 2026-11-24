import type { ComponentType } from "react";
import {
  Activity,
  ArrowRightLeft,
  FilePlus2,
  LogIn,
  LogOut,
  Mail,
  MailCheck,
  MailX,
  Pencil,
  ShieldCheck,
  Trash2,
  UserMinus,
  UserPen,
  UserPlus,
} from "lucide-react";
import { STATUS_LABELS, type JobStatus } from "@/lib/constants";
import { ROLE_LABELS, type UserRole } from "@/lib/constants/roles";

export interface AuditLog {
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

/** Action values written by the API routes and DB triggers. */
export const ACTION_OPTIONS: { value: string; label: string }[] = [
  { value: "job.created", label: "Job created" },
  { value: "job.updated", label: "Job updated" },
  { value: "job.status_changed", label: "Job status changed" },
  { value: "job.deleted", label: "Job deleted" },
  { value: "customer.updated", label: "Customer updated" },
  { value: "invite.sent", label: "Invite sent" },
  { value: "invite.accepted", label: "Invite accepted" },
  { value: "user.created", label: "User created" },
  { value: "user.updated", label: "User updated" },
  { value: "user.role_changed", label: "Role changed" },
  { value: "user.deleted", label: "User removed" },
];

type Tone = "green" | "blue" | "red" | "violet" | "amber" | "sky" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  neutral: "bg-muted text-muted-foreground",
};

export function getActionVisual(action: string): {
  icon: ComponentType<{ className?: string }>;
  className: string;
} {
  const pick = (icon: ComponentType<{ className?: string }>, tone: Tone) => ({
    icon,
    className: TONE_CLASSES[tone],
  });
  switch (action) {
    case "job.created":
      return pick(FilePlus2, "green");
    case "job.updated":
      return pick(Pencil, "blue");
    case "job.deleted":
      return pick(Trash2, "red");
    case "job.status_changed":
      return pick(ArrowRightLeft, "violet");
    case "customer.updated":
      return pick(UserPen, "blue");
    case "user.created":
      return pick(UserPlus, "green");
    case "user.updated":
      return pick(UserPen, "blue");
    case "user.deleted":
      return pick(UserMinus, "red");
    case "user.role_changed":
      return pick(ShieldCheck, "amber");
    case "invite.sent":
      return pick(Mail, "sky");
    case "invite.accepted":
      return pick(MailCheck, "green");
    case "invite.expired":
      return pick(MailX, "neutral");
  }
  if (/login|sign_?in/.test(action)) return pick(LogIn, "neutral");
  if (/logout|sign_?out/.test(action)) return pick(LogOut, "neutral");
  if (action.includes("deleted")) return pick(Trash2, "red");
  if (action.includes("created")) return pick(FilePlus2, "green");
  if (action.includes("updated")) return pick(Pencil, "blue");
  return pick(Activity, "neutral");
}

/** "job.status_changed" → "Job status changed" */
export function formatActionLabel(action: string): string {
  const known = ACTION_OPTIONS.find((o) => o.value === action);
  if (known) return known.label;
  const text = action.replace(/[._]/g, " ").trim().toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** snake_case key → sentence-case label ("address_area" → "Address area"). */
export function formatFieldLabel(key: string): string {
  const text = key.replace(/_/g, " ").trim().toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function getActorName(log: AuditLog): string {
  return log.user ? log.user.name || log.user.email : "System";
}

export function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export function statusLabel(value: unknown): string {
  const s = str(value);
  if (!s) return "—";
  return STATUS_LABELS[s as JobStatus] ?? formatFieldLabel(s);
}

export function roleLabel(value: unknown): string {
  const s = str(value);
  if (!s) return "—";
  return ROLE_LABELS[s as UserRole] ?? formatFieldLabel(s);
}

export function getChangedKeys(log: AuditLog): string[] {
  const changes = log.details?.changes;
  return changes && typeof changes === "object" && !Array.isArray(changes)
    ? Object.keys(changes as Record<string, unknown>)
    : [];
}

/** "Name, Email and 2 more" */
export function summarizeKeys(keys: string[], max = 3): string {
  const labels = keys.map(formatFieldLabel);
  if (labels.length <= max) {
    if (labels.length <= 1) return labels.join("");
    return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
  }
  return `${labels.slice(0, max).join(", ")} and ${labels.length - max} more`;
}

/** Link to the job page, unless the job was deleted. */
export function getJobHref(log: AuditLog): string | undefined {
  return log.resource_type === "job" && log.resource_id && log.action !== "job.deleted"
    ? `/jobs/${log.resource_id}`
    : undefined;
}

/**
 * Customer badge for entries that involve a customer (job entries carry the
 * customer name; customer.updated carries old/new names).
 */
export function getCustomerLink(log: AuditLog): { label: string; href: string } | null {
  const d = log.details || {};
  const name =
    log.resource_type === "customer"
      ? (str(d.new_customer_name) ?? str(d.old_customer_name))
      : log.resource_type === "job"
        ? str(d.customer_name)
        : undefined;
  return name ? { label: name, href: `/customers/${encodeURIComponent(name)}` } : null;
}

export interface DetailRow {
  key: string;
  label: string;
  from?: string;
  to: string;
}

const HIDDEN_DETAIL_KEYS = new Set(["changes"]);

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (/(^|_)status$/.test(key)) return statusLabel(value);
  if (/(^|_)role$/.test(key)) return roleLabel(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString("en-IN");
  if (Array.isArray(value)) {
    return value.length
      ? value.map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v))).join(", ")
      : "—";
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Key/value rows for the expanded details: old_x/new_x pairs become
 * "x: old → new", entries under `changes` are listed field by field.
 */
export function getDetailRows(log: AuditLog): DetailRow[] {
  const d = log.details || {};
  const rows: DetailRow[] = [];
  const used = new Set<string>();

  for (const key of Object.keys(d)) {
    if (!key.startsWith("old_")) continue;
    const base = key.slice(4);
    const newKey = `new_${base}`;
    if (!(newKey in d)) continue;
    used.add(key);
    used.add(newKey);
    rows.push({
      key: base,
      label: formatFieldLabel(base),
      from: formatValue(base, d[key]),
      to: formatValue(base, d[newKey]),
    });
  }

  for (const [key, value] of Object.entries(d)) {
    if (used.has(key) || HIDDEN_DETAIL_KEYS.has(key)) continue;
    rows.push({ key, label: formatFieldLabel(key), to: formatValue(key, value) });
  }

  const changes = d.changes;
  if (changes && typeof changes === "object" && !Array.isArray(changes)) {
    for (const [key, value] of Object.entries(changes as Record<string, unknown>)) {
      // customer.updated repeats the new name inside `changes`.
      if (rows.some((r) => r.key === key && r.from !== undefined)) continue;
      rows.push({
        key: `changes.${key}`,
        label: formatFieldLabel(key),
        to: formatValue(key, value),
      });
    }
  }

  return rows;
}

const IST_TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const IST_DAY_KEY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** YYYY-MM-DD of the instant in IST. */
export function istDayKey(date: Date): string {
  return IST_DAY_KEY.format(date);
}

export function formatIstTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : IST_TIME.format(date);
}

export function formatIstDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** "Today", "Yesterday", "Mon, 24 Nov" (with the year when not this year). */
export function formatDayHeading(dayKey: string, now = new Date()): string {
  const today = istDayKey(now);
  const yesterday = istDayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  if (dayKey === today) return "Today";
  if (dayKey === yesterday) return "Yesterday";
  const [y, m, d] = dayKey.split("-").map(Number);
  // Noon UTC keeps the calendar date stable when formatting in any zone.
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...options }).format(date);
  const label = `${part({ weekday: "short" })}, ${d} ${part({ month: "short" })}`;
  return dayKey.slice(0, 4) !== today.slice(0, 4) ? `${label} ${y}` : label;
}

/** Group logs (already newest-first) by IST calendar day. */
export function groupByDay(logs: AuditLog[]): { day: string; logs: AuditLog[] }[] {
  const groups: { day: string; logs: AuditLog[] }[] = [];
  for (const log of logs) {
    const date = new Date(log.created_at);
    const day = Number.isNaN(date.getTime()) ? "unknown" : istDayKey(date);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.logs.push(log);
    else groups.push({ day, logs: [log] });
  }
  return groups;
}
