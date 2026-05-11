import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Dialog, DialogContent, Label } from "@rootcx/ui";
import {
  IconAlignLeft, IconChecklist, IconCheck, IconClock, IconFlag,
  IconMessage, IconX,
} from "@tabler/icons-react";
import { cn, formatDate, isOverdue, isDueSoon, normalizePriority } from "@/lib/utils";
import {
  Card, CardComment, ChecklistItem, LABEL_COLORS, PRIORITY_CONFIG, LabelColor,
} from "@/types";

const MD_COMPONENTS: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-1">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-semibold mt-3 mb-1">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-semibold mt-2 mb-0.5">{children}</h3>,
  p:  ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 my-1 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 my-1 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="text-sm">{children}</li>,
  a:  ({ href, children }) => <a href={href} className="text-primary underline underline-offset-2 hover:opacity-80">{children}</a>,
  blockquote: ({ children }) => <blockquote className="border-l-2 border-border pl-3 italic text-muted-foreground my-2">{children}</blockquote>,
  code: ({ className, children }) => className?.includes("language-")
    ? <code className={cn("block text-xs font-mono", className)}>{children}</code>
    : <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded border border-border">{children}</code>,
  pre:    ({ children }) => <pre className="bg-muted border border-border rounded-md p-3 overflow-x-auto my-2 text-xs">{children}</pre>,
  hr:     () => <hr className="border-border my-3" />,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em:     ({ children }) => <em className="italic">{children}</em>,
};

interface Props {
  card: Card;
  listTitle: string;
  comments: CardComment[];
  onClose: () => void;
}

export function ReadOnlyCardDetail({ card, listTitle, comments, onClose }: Props) {
  const checklist: ChecklistItem[] = card.checklist || [];
  const labels: string[] = card.labels || [];
  const checkedCount = checklist.filter((i) => i.checked).length;
  const checklistProgress = checklist.length ? Math.round((checkedCount / checklist.length) * 100) : 0;
  const overdue = isOverdue(card.due_date);
  const dueSoon = isDueSoon(card.due_date);
  const priority = normalizePriority(card.priority);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl w-full p-0 gap-0 max-h-[90vh] flex flex-col overflow-hidden">
        {card.cover_color && <div className={cn("h-8 w-full flex-shrink-0", card.cover_color)} />}

        <div className="px-5 pt-4 pb-0 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">
              in list <span className="font-medium text-foreground">{listTitle}</span>
            </p>
            <h2 className="text-base font-semibold px-1 py-0.5 -mx-1">{card.title}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <IconX className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-5">
          <div className="flex-1 min-w-0 space-y-5 mt-4">

            {labels.length > 0 && (
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Labels</Label>
                <div className="flex flex-wrap gap-1.5">
                  {labels.map((labelStr) => {
                    const [color, name] = labelStr.split(":");
                    const cfg = LABEL_COLORS[color as LabelColor];
                    return cfg ? (
                      <span key={labelStr} className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium", cfg.bg, cfg.text)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />{name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {(priority || card.due_date) && (
              <div className="flex gap-4 flex-wrap">
                {priority && (
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1 block">Priority</Label>
                    <span className={cn("flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border", PRIORITY_CONFIG[priority].bg, PRIORITY_CONFIG[priority].color)}>
                      <IconFlag className="h-3 w-3" />{PRIORITY_CONFIG[priority].label}
                    </span>
                  </div>
                )}
                {card.due_date && (
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1 block">Due Date</Label>
                    <span className={cn("flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border",
                      overdue ? "bg-destructive/10 text-destructive border-destructive/20"
                      : dueSoon ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400"
                      : "bg-muted text-muted-foreground border-border"
                    )}>
                      <IconClock className="h-3 w-3" />{overdue && "Overdue · "}{formatDate(card.due_date)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-2">
                <IconAlignLeft className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Description</Label>
              </div>
              <div className="text-sm rounded px-3 py-2 min-h-[40px] border border-transparent">
                {card.description
                  ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{card.description}</ReactMarkdown>
                  : <span className="text-muted-foreground italic">No description</span>
                }
              </div>
            </div>

            {checklist.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <IconChecklist className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Checklist</Label>
                  <span className="ml-auto text-xs text-muted-foreground">{checkedCount}/{checklist.length}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full mb-3 overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-300", checklistProgress === 100 ? "bg-green-500" : "bg-primary")} style={{ width: `${checklistProgress}%` }} />
                </div>
                <div className="space-y-0.5">
                  {checklist.map((item) => (
                    <div key={item.id} className="flex items-start gap-2 rounded px-1 py-0.5">
                      <div className={cn("mt-0.5 w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center",
                        item.checked ? "bg-primary border-primary" : "border-muted-foreground")}>
                        {item.checked && <IconCheck className="h-2.5 w-2.5 text-primary-foreground" />}
                      </div>
                      <span className={cn("text-sm flex-1", item.checked && "line-through text-muted-foreground")}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {comments.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <IconMessage className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Activity</Label>
                </div>
                <div className="space-y-3">
                  {comments.map((cm) => (
                    <div key={cm.id} className="flex gap-2">
                      <div className="w-7 h-7 rounded-full bg-muted border border-border text-xs font-semibold flex items-center justify-center flex-shrink-0 text-foreground">
                        {cm.author_name[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-semibold">{cm.author_name}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(cm.created_at)}</span>
                        </div>
                        <p className="text-sm mt-0.5 bg-muted rounded px-3 py-2 border border-border">{cm.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
