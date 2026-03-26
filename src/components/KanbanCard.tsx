import { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@rootcx/ui";
import { cn } from "@/lib/utils";
import { Card, LABEL_COLORS, PRIORITY_CONFIG, LabelColor } from "@/types";
import { formatDate, isOverdue, isDueSoon, normalizePriority } from "@/lib/utils";
import { IconClock, IconChecklist, IconMessage, IconFlag, IconEdit } from "@tabler/icons-react";

interface Props {
  card: Card;
  commentCount: number;
  onOpen: (id: string) => void;
  onTitleSave: (id: string, title: string) => void;
  isDragging?: boolean;
}

export default function KanbanCard({ card, commentCount, onOpen, onTitleSave, isDragging }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: card.id, data: { type: "card", card } });

  const [editing, setEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(card.title);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 30);
  }, [editing]);

  const style = { transform: CSS.Transform.toString(transform), transition };

  const labels = card.labels || [];
  const checklist = card.checklist || [];
  const checkedCount = checklist.filter((i) => i.checked).length;
  const overdue = isOverdue(card.due_date);
  const dueSoon = isDueSoon(card.due_date);
  const priority = normalizePriority(card.priority);

  function handleSave() {
    const t = titleValue.trim();
    if (t && t !== card.title) onTitleSave(card.id, t);
    else setTitleValue(card.title);
    setEditing(false);
  }

  // Ghost placeholder while sorting
  if (isSortableDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-9 rounded border-2 border-dashed border-primary/40 bg-primary/5"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative bg-card rounded border border-border",
        "hover:border-ring hover:shadow-sm transition-all duration-100",
        "cursor-pointer select-none",
        isDragging && "opacity-50 rotate-1 shadow-lg"
      )}
    >
      {/* Cover strip */}
      {card.cover_color && (
        <div className={cn("h-6 rounded-t w-full", card.cover_color)} />
      )}

      <div
        className="p-2.5 pb-2"
        onClick={() => { if (!editing) onOpen(card.id); }}
        {...attributes}
        {...listeners}
      >
        {/* Labels */}
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {labels.map((labelStr) => {
              const [color, name] = labelStr.split(":");
              const cfg = LABEL_COLORS[color as LabelColor];
              return cfg ? (
                <span
                  key={labelStr}
                  title={name}
                  className={cn("h-1.5 w-8 rounded-full", cfg.dot)}
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
            className="w-full text-sm bg-transparent outline-none resize-none -my-0.5"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSave(); }
              if (e.key === "Escape") { setTitleValue(card.title); setEditing(false); }
            }}
            rows={2}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <p className="text-sm text-card-foreground leading-snug">{card.title}</p>
        )}

        {/* Metadata */}
        {(card.due_date || checklist.length > 0 || commentCount > 0 || priority) && (
          <div className="flex items-center flex-wrap gap-1.5 mt-2">
            {priority && (
              <span className={cn(
                "inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded",
                PRIORITY_CONFIG[priority].bg,
                PRIORITY_CONFIG[priority].color
              )}>
                <IconFlag className="h-2.5 w-2.5" />
                {PRIORITY_CONFIG[priority].label}
              </span>
            )}

            {card.due_date && (
              <span className={cn(
                "inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded",
                overdue ? "bg-destructive/10 text-destructive" :
                dueSoon ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                "bg-muted text-muted-foreground"
              )}>
                <IconClock className="h-2.5 w-2.5" />
                {formatDate(card.due_date)}
              </span>
            )}

            {checklist.length > 0 && (
              <span className={cn(
                "inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded",
                checkedCount === checklist.length
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-muted text-muted-foreground"
              )}>
                <IconChecklist className="h-2.5 w-2.5" />
                {checkedCount}/{checklist.length}
              </span>
            )}

            {commentCount > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <IconMessage className="h-2.5 w-2.5" />
                {commentCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Quick-edit pencil */}
      <button
        className="absolute top-1.5 right-1.5 p-1 rounded bg-card border border-border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted z-10"
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        title="Quick edit"
      >
        <IconEdit className="h-3 w-3 text-muted-foreground" />
      </button>
    </div>
  );
}

export function CardDropPlaceholder() {
  return (
    <div className="h-12 rounded border-2 border-dashed border-primary/40 bg-primary/5 flex items-center justify-center">
      <span className="text-xs text-primary/60">Drop here</span>
    </div>
  );
}
