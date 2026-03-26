import { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Card, LABEL_COLORS, PRIORITY_CONFIG, LabelColor } from "@/types";
import { formatDate, isOverdue, isDueSoon } from "@/lib/utils";
import {
  IconClock,
  IconChecklist,
  IconMessage,
  IconFlag,
  IconPaperclip,
} from "@tabler/icons-react";

interface Props {
  card: Card;
  commentCount: number;
  onOpen: (id: string) => void;
  onTitleSave: (id: string, title: string) => void;
  isDragging?: boolean;
}

export default function KanbanCard({
  card,
  commentCount,
  onOpen,
  onTitleSave,
  isDragging,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: card.id,
    data: { type: "card", card },
  });

  const [editing, setEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(card.title);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 30);
    }
  }, [editing]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const labels = card.labels || [];
  const checklist = card.checklist || [];
  const checkedCount = checklist.filter((i) => i.checked).length;
  const overdue = isOverdue(card.due_date);
  const dueSoon = isDueSoon(card.due_date);

  function handleSave() {
    const t = titleValue.trim();
    if (t && t !== card.title) onTitleSave(card.id, t);
    else setTitleValue(card.title);
    setEditing(false);
  }

  function handleCardClick(e: React.MouseEvent) {
    if (editing) return;
    onOpen(card.id);
  }

  if (isSortableDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-10 rounded-xl bg-primary/10 border-2 border-dashed border-primary/30"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative bg-card rounded-xl border border-border shadow-sm",
        "hover:shadow-md hover:border-border/80 transition-all duration-150",
        "cursor-pointer select-none",
        isDragging && "opacity-50 rotate-1 shadow-2xl scale-105"
      )}
    >
      {/* Cover color strip */}
      {card.cover_color && (
        <div
          className={cn(
            "h-8 rounded-t-xl w-full",
            card.cover_color
          )}
        />
      )}

      <div
        className="p-3 pb-2"
        onClick={handleCardClick}
        {...attributes}
        {...listeners}
      >
        {/* Labels */}
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {labels.map((labelStr) => {
              const [color, name] = labelStr.split(":");
              const cfg = LABEL_COLORS[color as LabelColor];
              return cfg ? (
                <span
                  key={labelStr}
                  className={cn(
                    "inline-block h-2 w-10 rounded-full transition-all hover:w-16 hover:px-1.5 hover:h-5 hover:flex hover:items-center",
                    "overflow-hidden text-[10px] font-medium",
                    cfg.dot
                  )}
                  title={name}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : null;
            })}
          </div>
        )}

        {/* Title */}
        {editing ? (
          <textarea
            ref={inputRef}
            className="w-full text-sm font-medium bg-transparent outline-none resize-none -my-0.5"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSave();
              }
              if (e.key === "Escape") {
                setTitleValue(card.title);
                setEditing(false);
              }
            }}
            rows={2}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <p className="text-sm font-medium leading-snug text-card-foreground">
            {card.title}
          </p>
        )}

        {/* Metadata row */}
        {(card.due_date ||
          checklist.length > 0 ||
          commentCount > 0 ||
          card.priority) && (
          <div className="flex items-center flex-wrap gap-2 mt-2.5">
            {/* Priority badge */}
            {card.priority && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded",
                  PRIORITY_CONFIG[card.priority].bg,
                  PRIORITY_CONFIG[card.priority].color
                )}
              >
                <IconFlag className="h-2.5 w-2.5" />
                {PRIORITY_CONFIG[card.priority].label}
              </span>
            )}

            {/* Due date */}
            {card.due_date && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded",
                  overdue
                    ? "bg-red-100 text-red-700"
                    : dueSoon
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <IconClock className="h-2.5 w-2.5" />
                {formatDate(card.due_date)}
              </span>
            )}

            {/* Checklist */}
            {checklist.length > 0 && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded",
                  checkedCount === checklist.length
                    ? "bg-green-100 text-green-700"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <IconChecklist className="h-2.5 w-2.5" />
                {checkedCount}/{checklist.length}
              </span>
            )}

            {/* Comments */}
            {commentCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                <IconMessage className="h-2.5 w-2.5" />
                {commentCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Quick edit button — visible on hover */}
      <button
        className="absolute top-2 right-2 p-1 rounded-md bg-card/90 border border-border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted z-10"
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        title="Quick edit (E)"
      >
        <svg
          className="h-3 w-3 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
      </button>
    </div>
  );
}

/** Ghost placeholder shown when dragging over an empty list */
export function CardDropPlaceholder() {
  return (
    <div className="h-16 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 flex items-center justify-center">
      <span className="text-xs text-primary/60 font-medium">Drop here</span>
    </div>
  );
}
