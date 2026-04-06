import { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn, formatDate, isOverdue, isDueSoon, normalizePriority } from "@/lib/utils";
import { Card, CardAssignee, OrgUser, LABEL_COLORS, PRIORITY_CONFIG, LabelColor } from "@/types";
import { IconClock, IconChecklist, IconMessage, IconFlag, IconEdit } from "@tabler/icons-react";
import { AssigneeAvatars } from "./MemberPicker";

interface Props {
  card: Card;
  commentCount: number;
  assignees: CardAssignee[];
  orgUsers: OrgUser[];
  onOpen: (id: string) => void;
  onTitleSave: (id: string, title: string) => void;
  onSpaceAssign: (id: string) => void;
  isDragging?: boolean;
}

export default function KanbanCard({ card, commentCount, assignees, orgUsers, onOpen, onTitleSave, onSpaceAssign, isDragging }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({ id: card.id, data: { type: "card", card } });

  const [editing, setEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(card.title);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 30);
  }, [editing]);

  useEffect(() => {
    if (!hovered) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || editing) return;
      if (e.code === "Space") { e.preventDefault(); onSpaceAssign(card.id); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [hovered, editing, card.id, onSpaceAssign]);

  const labels = card.labels ?? [];
  const checklist = card.checklist ?? [];
  const checkedCount = checklist.filter((i) => i.checked).length;
  const priority = normalizePriority(card.priority);
  const overdue = isOverdue(card.due_date);
  const dueSoon = isDueSoon(card.due_date);

  function handleSave() {
    const t = titleValue.trim();
    if (t && t !== card.title) onTitleSave(card.id, t);
    else setTitleValue(card.title);
    setEditing(false);
  }

  if (isSortableDragging)
    return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="h-9 rounded border-2 border-dashed border-primary/40 bg-primary/5" />;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "group relative bg-card rounded border border-border cursor-pointer select-none",
        "hover:border-ring hover:shadow-sm transition-all duration-100",
        isDragging && "opacity-50 rotate-1 shadow-lg"
      )}
    >
      {card.cover_color && <div className={cn("h-6 rounded-t w-full", card.cover_color)} />}

      <div className="p-2.5 pb-2" onClick={() => { if (!editing) onOpen(card.id); }} {...attributes} {...listeners}>
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {labels.map((labelStr) => {
              const [color, name] = labelStr.split(":");
              const cfg = LABEL_COLORS[color as LabelColor];
              return cfg ? <span key={labelStr} title={name} className={cn("h-1.5 w-8 rounded-full", cfg.dot)} onClick={(e) => e.stopPropagation()} /> : null;
            })}
          </div>
        )}

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

        {/* Always rendered — prevents height shift when assignees are added */}
        <div className="flex items-center flex-wrap gap-1.5 mt-2 min-h-[20px]">
          {priority && (
            <span className={cn("inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded", PRIORITY_CONFIG[priority].bg, PRIORITY_CONFIG[priority].color)}>
              <IconFlag className="h-2.5 w-2.5" />{PRIORITY_CONFIG[priority].label}
            </span>
          )}
          {card.due_date && (
            <span className={cn(
              "inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded",
              overdue ? "bg-destructive/10 text-destructive" :
              dueSoon ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
              "bg-muted text-muted-foreground"
            )}>
              <IconClock className="h-2.5 w-2.5" />{formatDate(card.due_date)}
            </span>
          )}
          {checklist.length > 0 && (
            <span className={cn(
              "inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded",
              checkedCount === checklist.length ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"
            )}>
              <IconChecklist className="h-2.5 w-2.5" />{checkedCount}/{checklist.length}
            </span>
          )}
          {commentCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <IconMessage className="h-2.5 w-2.5" />{commentCount}
            </span>
          )}
          {assignees.length > 0 && (
            <span className="ml-auto" onClick={(e) => e.stopPropagation()}>
              <AssigneeAvatars assignees={assignees} users={orgUsers} />
            </span>
          )}
        </div>
      </div>

      <button
        className="absolute top-1.5 right-1.5 p-1 rounded bg-card border border-border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted z-10"
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        title="Quick edit"
      >
        <IconEdit className="h-3 w-3 text-muted-foreground" />
      </button>

      {/* Space-to-assign hint — only when no assignee yet */}
      {hovered && !editing && assignees.length === 0 && (
        <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px] font-mono text-muted-foreground">Space</kbd>
        </div>
      )}
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
