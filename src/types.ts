// Core domain types for the Kanban board

export interface Board {
  id: string;
  title: string;
  description?: string;
  color?: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface List {
  id: string;
  title: string;
  board_id: string;
  position: number;
  color?: string;
  created_at: string;
  updated_at: string;
}

export type Priority = "low" | "medium" | "high" | "critical";

export type LabelColor =
  | "green"
  | "yellow"
  | "orange"
  | "red"
  | "purple"
  | "blue"
  | "sky"
  | "lime"
  | "pink"
  | "teal";

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  list_id: string;
  board_id: string;
  position: number;
  labels?: string[]; // "color:name" format e.g. "green:Design"
  priority?: Priority;
  due_date?: string;
  checklist?: ChecklistItem[];
  cover_color?: string;
  archived?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CardAssignee {
  id: string;
  card_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Minimal user shape returned by core:users
export interface OrgUser {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
}

export interface CardComment {
  id: string;
  card_id: string;
  content: string;
  author_name: string;
  created_at: string;
  updated_at: string;
}

export const LABEL_COLORS: Record<
  LabelColor,
  { bg: string; text: string; dot: string; name: string }
> = {
  green: {
    bg: "bg-green-100 hover:bg-green-200",
    text: "text-green-800",
    dot: "bg-green-500",
    name: "Green",
  },
  yellow: {
    bg: "bg-yellow-100 hover:bg-yellow-200",
    text: "text-yellow-800",
    dot: "bg-yellow-500",
    name: "Yellow",
  },
  orange: {
    bg: "bg-orange-100 hover:bg-orange-200",
    text: "text-orange-800",
    dot: "bg-orange-500",
    name: "Orange",
  },
  red: {
    bg: "bg-red-100 hover:bg-red-200",
    text: "text-red-800",
    dot: "bg-red-500",
    name: "Red",
  },
  purple: {
    bg: "bg-purple-100 hover:bg-purple-200",
    text: "text-purple-800",
    dot: "bg-purple-500",
    name: "Purple",
  },
  blue: {
    bg: "bg-blue-100 hover:bg-blue-200",
    text: "text-blue-800",
    dot: "bg-blue-500",
    name: "Blue",
  },
  sky: {
    bg: "bg-sky-100 hover:bg-sky-200",
    text: "text-sky-800",
    dot: "bg-sky-500",
    name: "Sky",
  },
  lime: {
    bg: "bg-lime-100 hover:bg-lime-200",
    text: "text-lime-800",
    dot: "bg-lime-500",
    name: "Lime",
  },
  pink: {
    bg: "bg-pink-100 hover:bg-pink-200",
    text: "text-pink-800",
    dot: "bg-pink-500",
    name: "Pink",
  },
  teal: {
    bg: "bg-teal-100 hover:bg-teal-200",
    text: "text-teal-800",
    dot: "bg-teal-500",
    name: "Teal",
  },
};

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string; bg: string }
> = {
  low: { label: "Low", color: "text-slate-500", bg: "bg-slate-100" },
  medium: { label: "Medium", color: "text-blue-600", bg: "bg-blue-50" },
  high: { label: "High", color: "text-orange-600", bg: "bg-orange-50" },
  critical: { label: "Critical", color: "text-red-600", bg: "bg-red-50" },
};

export const COVER_COLORS = [
  { value: "bg-red-400", label: "Red" },
  { value: "bg-orange-400", label: "Orange" },
  { value: "bg-yellow-400", label: "Yellow" },
  { value: "bg-green-400", label: "Green" },
  { value: "bg-teal-400", label: "Teal" },
  { value: "bg-blue-400", label: "Blue" },
  { value: "bg-purple-400", label: "Purple" },
  { value: "bg-pink-400", label: "Pink" },
  { value: "bg-slate-400", label: "Gray" },
  { value: "bg-stone-600", label: "Dark" },
];

export const BOARD_GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-purple-500 to-pink-600",
  "from-green-500 to-teal-600",
  "from-orange-500 to-red-600",
  "from-yellow-500 to-orange-500",
  "from-sky-500 to-blue-600",
  "from-rose-500 to-pink-600",
  "from-emerald-500 to-green-600",
];
