import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Compute new fractional position between two positions, or at end/beginning */
export function computePosition(
  before: number | undefined,
  after: number | undefined
): number {
  if (before === undefined && after === undefined) return 65536;
  if (before === undefined) return (after as number) / 2;
  if (after === undefined) return (before as number) + 65536;
  return (before + after) / 2;
}

/** Sort by position then created_at */
export function byPosition<T extends { position: number; created_at: string }>(
  a: T,
  b: T
): number {
  if (a.position !== b.position) return a.position - b.position;
  return a.created_at.localeCompare(b.created_at);
}

/** Format a date string as "Jan 12" or "Jan 12, 2024" */
export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const opts: Intl.DateTimeFormatOptions =
    d.getFullYear() === now.getFullYear()
      ? { month: "short", day: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" };
  return d.toLocaleDateString("en-US", opts);
}

/** Is the due date overdue? */
export function isOverdue(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

/** Is due date within 24 hours? */
export function isDueSoon(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return diff > 0 && diff < 24 * 60 * 60 * 1000;
}

/** Generate a unique id for optimistic checklist items */
export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}
