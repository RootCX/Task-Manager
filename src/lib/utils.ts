import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Priority } from "@/types";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export function computePosition(before?: number, after?: number): number {
  if (before === undefined && after === undefined) return 65536;
  if (before === undefined) return (after as number) / 2;
  if (after === undefined) return before + 65536;
  return (before + after) / 2;
}

export function byPosition<T extends { position: number; created_at: string }>(a: T, b: T): number {
  return a.position !== b.position ? a.position - b.position : a.created_at.localeCompare(b.created_at);
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-US", sameYear ? { month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" });
}

export function isOverdue(dateStr?: string): boolean {
  return !!dateStr && new Date(dateStr) < new Date();
}

export function isDueSoon(dateStr?: string): boolean {
  if (!dateStr) return false;
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff > 0 && diff < 86_400_000;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function normalizePriority(p?: string): Priority | undefined {
  if (!p) return undefined;
  const lower = p.toLowerCase() as Priority;
  return (["low", "medium", "high", "critical"] as Priority[]).includes(lower) ? lower : undefined;
}
