import { cn, formatDate, isOverdue, isDueSoon, normalizePriority } from "@/lib/utils";
import { Card, CardAssignee, OrgUser, LABEL_COLORS, PRIORITY_CONFIG, LabelColor } from "@/types";
import { IconClock, IconChecklist, IconMessage, IconFlag } from "@tabler/icons-react";
import { AssigneeAvatars } from "./MemberPicker";

interface Props {
  card: Card;
  commentCount: number;
  assignees: CardAssignee[];
  orgUsers: OrgUser[];
  onOpen?: (id: string) => void;
}

export function ReadOnlyCard({ card, commentCount, assignees, orgUsers, onOpen }: Props) {
  const labels = card.labels ?? [];
  const checklist = card.checklist ?? [];
  const checkedCount = checklist.filter((i) => i.checked).length;
  const priority = normalizePriority(card.priority);
  const overdue = isOverdue(card.due_date);
  const dueSoon = isDueSoon(card.due_date);

  return (
    <div
      className={cn("group relative bg-card rounded border border-border select-none", onOpen && "cursor-pointer hover:border-ring hover:shadow-sm transition-all duration-100")}
      onClick={() => onOpen?.(card.id)}
    >
      {card.cover_color && <div className={cn("h-6 rounded-t w-full", card.cover_color)} />}

      <div className="p-2.5 pb-2">
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {labels.map((labelStr) => {
              const [color, name] = labelStr.split(":");
              const cfg = LABEL_COLORS[color as LabelColor];
              return cfg ? <span key={labelStr} title={name} className={cn("h-1.5 w-8 rounded-full", cfg.dot)} /> : null;
            })}
          </div>
        )}

        <p className="text-sm text-card-foreground leading-snug">{card.title}</p>

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
            <span className="ml-auto">
              <AssigneeAvatars assignees={assignees} users={orgUsers} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
