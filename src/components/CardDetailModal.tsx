import { useState, useRef, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAppCollection, useAppRecord } from "@rootcx/sdk";
import {
  Button, Dialog, DialogContent, Input, Label, Textarea, Separator,
  Popover, PopoverTrigger, PopoverContent, ConfirmDialog,
} from "@rootcx/ui";
import {
  IconX, IconTrash, IconCalendar, IconFlag, IconTag,
  IconChecklist, IconCheck, IconAlignLeft, IconMessage,
  IconEdit, IconClock, IconPalette, IconUsers,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import {
  Card, CardComment, CardAssignee, OrgUser,
  ChecklistItem, LABEL_COLORS, PRIORITY_CONFIG, COVER_COLORS, Priority, LabelColor,
} from "@/types";
import { formatDate, isOverdue, isDueSoon, uid, normalizePriority } from "@/lib/utils";
import MemberPicker, { UserAvatar, getDisplayName } from "./MemberPicker";

const APP_ID = "task_manager";

const PREDEFINED_LABELS: Array<{ color: LabelColor; name: string }> = [
  { color: "green", name: "Design" }, { color: "yellow", name: "Review" },
  { color: "orange", name: "In Progress" }, { color: "red", name: "Blocked" },
  { color: "purple", name: "Backend" }, { color: "blue", name: "Frontend" },
  { color: "sky", name: "Research" }, { color: "lime", name: "Done" },
  { color: "pink", name: "Marketing" }, { color: "teal", name: "Onboarding" },
];

const MD_COMPONENTS: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-1">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-semibold mt-3 mb-1">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-semibold mt-2 mb-0.5">{children}</h3>,
  h4: ({ children }) => <h4 className="text-sm font-semibold mt-2">{children}</h4>,
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

const SIDEBAR_BTN = "w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted";

interface Props {
  cardId: string | null;
  listTitle: string;
  currentUserId: string;
  orgUsers: OrgUser[];
  // Owned by KanbanBoard — single source of truth
  assignees: CardAssignee[];
  onAssigneeToggle: (cardId: string, userId: string) => Promise<void>;
  onClose: () => void;
  onCardDeleted?: () => void;
}

export default function CardDetailModal({
  cardId, listTitle, currentUserId, orgUsers,
  assignees, onAssigneeToggle,
  onClose, onCardDeleted,
}: Props) {
  const { data: card, update, remove } = useAppRecord<Card>(APP_ID, "card", cardId);
  const { data: comments, create: createComment, remove: removeComment } =
    useAppCollection<CardComment>(APP_ID, "card_comment", {
      where: cardId ? { card_id: cardId } : undefined,
      orderBy: "created_at", order: "asc",
    });

  const userMap = useMemo(() => new Map(orgUsers.map((u) => [u.id, u])), [orgUsers]);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState("");
  const [commentValue, setCommentValue] = useState("");
  const [newCheckItem, setNewCheckItem] = useState("");
  const [addingCheckItem, setAddingCheckItem] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);
  const checkItemRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (card) { setTitleValue(card.title); setDescValue(card.description || ""); }
  }, [card?.id]);

  useEffect(() => { if (editingTitle) setTimeout(() => titleInputRef.current?.focus(), 30); }, [editingTitle]);
  useEffect(() => { if (editingDesc) setTimeout(() => descTextareaRef.current?.focus(), 30); }, [editingDesc]);
  useEffect(() => { if (addingCheckItem) setTimeout(() => checkItemRef.current?.focus(), 30); }, [addingCheckItem]);

  // Space = toggle self-assignment
  useEffect(() => {
    if (!cardId) return;
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.code !== "Space") return;
      e.preventDefault();
      onAssigneeToggle(cardId!, currentUserId);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cardId, currentUserId, onAssigneeToggle]);

  if (!cardId || !card) return null;
  const c = card;

  const checklist: ChecklistItem[] = c.checklist || [];
  const labels: string[] = c.labels || [];
  const checkedCount = checklist.filter((i) => i.checked).length;
  const checklistProgress = checklist.length ? Math.round((checkedCount / checklist.length) * 100) : 0;
  const overdue = isOverdue(c.due_date);
  const dueSoon = isDueSoon(c.due_date);
  const priority = normalizePriority(c.priority);

  async function saveTitle() {
    if (!titleValue.trim()) { setTitleValue(c.title); setEditingTitle(false); return; }
    if (titleValue !== c.title) await update({ title: titleValue.trim() });
    setEditingTitle(false);
  }

  async function saveDesc() {
    await update({ description: descValue.trim() || undefined });
    setEditingDesc(false);
  }

  async function addCheckItem() {
    if (!newCheckItem.trim()) return;
    await update({ checklist: [...checklist, { id: uid(), text: newCheckItem.trim(), checked: false }] });
    setNewCheckItem("");
  }

  async function postComment() {
    if (!commentValue.trim()) return;
    await createComment({ card_id: c.id, content: commentValue.trim(), author_name: "Me" });
    setCommentValue("");
  }

  async function handleDeleteCard() {
    await remove();
    onCardDeleted?.();
    onClose();
  }

  return (
    <Dialog open={!!cardId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl w-full p-0 gap-0 max-h-[90vh] flex flex-col overflow-hidden">
        {c.cover_color && <div className={cn("h-8 w-full flex-shrink-0", c.cover_color)} />}

        <div className="px-5 pt-4 pb-0 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">
              in list <span className="font-medium text-foreground">{listTitle}</span>
            </p>
            {editingTitle ? (
              <Input
                ref={titleInputRef}
                className="text-base font-semibold h-auto py-1"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveTitle();
                  if (e.key === "Escape") { setTitleValue(c.title); setEditingTitle(false); }
                }}
              />
            ) : (
              <h2 className="text-base font-semibold cursor-pointer hover:bg-muted rounded px-1 py-0.5 -mx-1 transition-colors" onClick={() => setEditingTitle(true)}>
                {c.title}
              </h2>
            )}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-5">
          <div className="flex gap-5 mt-4">
            <div className="flex-1 min-w-0 space-y-5">

              {labels.length > 0 && (
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Labels</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {labels.map((labelStr) => {
                      const [color, name] = labelStr.split(":");
                      const cfg = LABEL_COLORS[color as LabelColor];
                      return cfg ? (
                        <button key={labelStr} onClick={() => update({ labels: labels.filter((l) => l !== labelStr) })} className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium", cfg.bg, cfg.text)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />{name}
                        </button>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {assignees.length > 0 && (
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Members</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {assignees.map((a) => {
                      const u = userMap.get(a.user_id);
                      if (!u) return null;
                      const name = getDisplayName(u);
                      return (
                        <button key={a.id} title={`Remove ${name}`} onClick={() => onAssigneeToggle(cardId, a.user_id)}
                          className="group/avatar flex items-center gap-1.5 rounded-full pr-1.5 border border-border bg-muted hover:bg-destructive/10 hover:border-destructive/30 transition-colors"
                        >
                          <UserAvatar user={u} size="sm" />
                          <span className="text-xs text-muted-foreground group-hover/avatar:text-destructive transition-colors max-w-[80px] truncate">
                            {u.id === currentUserId ? "You" : name.split(" ")[0]}
                          </span>
                          <IconX className="h-2.5 w-2.5 text-muted-foreground group-hover/avatar:text-destructive opacity-0 group-hover/avatar:opacity-100 transition-all" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {(priority || c.due_date) && (
                <div className="flex gap-4 flex-wrap">
                  {priority && (
                    <div>
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1 block">Priority</Label>
                      <span className={cn("flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border", PRIORITY_CONFIG[priority].bg, PRIORITY_CONFIG[priority].color)}>
                        <IconFlag className="h-3 w-3" />{PRIORITY_CONFIG[priority].label}
                      </span>
                    </div>
                  )}
                  {c.due_date && (
                    <div>
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1 block">Due Date</Label>
                      <span className={cn("flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border",
                        overdue ? "bg-destructive/10 text-destructive border-destructive/20"
                        : dueSoon ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400"
                        : "bg-muted text-muted-foreground border-border"
                      )}>
                        <IconClock className="h-3 w-3" />{overdue && "Overdue · "}{formatDate(c.due_date)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <IconAlignLeft className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Description</Label>
                  {!editingDesc && c.description && (
                    <Button variant="ghost" size="sm" className="ml-auto h-6 text-xs px-2" onClick={() => setEditingDesc(true)}>
                      <IconEdit className="h-3 w-3 mr-1" />Edit
                    </Button>
                  )}
                </div>
                {editingDesc ? (
                  <div className="space-y-2">
                    <Textarea ref={descTextareaRef} className="min-h-[120px] text-sm resize-none font-mono"
                      value={descValue} onChange={(e) => setDescValue(e.target.value)}
                      placeholder="Add a more detailed description… (Markdown supported)"
                      onKeyDown={(e) => { if (e.key === "Escape") { setDescValue(c.description || ""); setEditingDesc(false); } }}
                    />
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={saveDesc}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setDescValue(c.description || ""); setEditingDesc(false); }}>Cancel</Button>
                      <span className="ml-auto text-xs text-muted-foreground">Markdown supported</span>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => setEditingDesc(true)} className={cn("text-sm rounded px-3 py-2 cursor-pointer min-h-[56px] border transition-colors",
                    c.description ? "border-transparent hover:border-border hover:bg-muted text-foreground" : "border-dashed border-border bg-muted/50 hover:bg-muted text-muted-foreground"
                  )}>
                    {c.description
                      ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{c.description}</ReactMarkdown>
                      : <span className="text-muted-foreground">Click to add a description…</span>
                    }
                  </div>
                )}
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
                      <div key={item.id} className="flex items-start gap-2 group rounded px-1 py-0.5 hover:bg-muted transition-colors">
                        <button onClick={() => update({ checklist: checklist.map((i) => i.id === item.id ? { ...i, checked: !i.checked } : i) })}
                          className={cn("mt-0.5 w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors", item.checked ? "bg-primary border-primary" : "border-muted-foreground hover:border-primary")}>
                          {item.checked && <IconCheck className="h-2.5 w-2.5 text-primary-foreground" />}
                        </button>
                        <span className={cn("text-sm flex-1", item.checked && "line-through text-muted-foreground")}>{item.text}</span>
                        <button onClick={() => update({ checklist: checklist.filter((i) => i.id !== item.id) })} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                          <IconX className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {addingCheckItem && (
                <div className="space-y-2">
                  <Input ref={checkItemRef} placeholder="Add an item…" value={newCheckItem} onChange={(e) => setNewCheckItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addCheckItem();
                      if (e.key === "Escape") { setNewCheckItem(""); setAddingCheckItem(false); }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { addCheckItem(); setAddingCheckItem(false); }}>Add</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setNewCheckItem(""); setAddingCheckItem(false); }}>Cancel</Button>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <IconMessage className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Activity</Label>
                </div>
                <div className="space-y-2 mb-4">
                  <Textarea className="min-h-[56px] text-sm resize-none" value={commentValue} onChange={(e) => setCommentValue(e.target.value)}
                    placeholder="Write a comment… (Enter to post)"
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); postComment(); } }}
                  />
                  {commentValue && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={postComment}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setCommentValue("")}>Cancel</Button>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {comments.map((cm) => (
                    <div key={cm.id} className="flex gap-2 group">
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
                      <button onClick={() => removeComment(cm.id)} className="opacity-0 group-hover:opacity-100 self-start mt-1 text-muted-foreground hover:text-destructive transition-all">
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-32 flex-shrink-0 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Add to card</p>

              <Popover>
                <PopoverTrigger asChild>
                  <button className={SIDEBAR_BTN}><IconUsers className="h-3.5 w-3.5" />Members</button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-60" align="end">
                  <MemberPicker
                    currentUserId={currentUserId}
                    orgUsers={orgUsers}
                    assignees={assignees}
                    onToggle={(userId) => onAssigneeToggle(cardId, userId)}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <button className={SIDEBAR_BTN}><IconTag className="h-3.5 w-3.5" />Labels</button>
                </PopoverTrigger>
                <PopoverContent className="p-3 w-52" align="end">
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Labels</p>
                  <div className="space-y-1">
                    {PREDEFINED_LABELS.map(({ color, name }) => {
                      const labelStr = `${color}:${name}`;
                      const cfg = LABEL_COLORS[color];
                      const active = labels.includes(labelStr);
                      return (
                        <button key={labelStr} onClick={() => update({ labels: active ? labels.filter((l) => l !== labelStr) : [...labels, labelStr] })}
                          className={cn("w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm font-medium transition-all", cfg.bg, cfg.text, active && "ring-2 ring-offset-1 ring-current")}>
                          <span className={cn("w-3 h-3 rounded-full flex-shrink-0", cfg.dot)} />{name}
                          {active && <IconCheck className="h-3.5 w-3.5 ml-auto" />}
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>

              <button className={SIDEBAR_BTN} onClick={() => setAddingCheckItem(true)}>
                <IconChecklist className="h-3.5 w-3.5" />Checklist
              </button>

              <Popover>
                <PopoverTrigger asChild>
                  <button className={SIDEBAR_BTN}><IconCalendar className="h-3.5 w-3.5" />Due Date</button>
                </PopoverTrigger>
                <PopoverContent className="p-3 w-52" align="end">
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Due Date</p>
                  <Input type="date" className="text-sm" value={c.due_date || ""} onChange={(e) => update({ due_date: e.target.value || undefined })} />
                  {c.due_date && (
                    <button onClick={() => update({ due_date: undefined })} className="w-full text-xs text-muted-foreground hover:text-foreground px-2 py-1 mt-1 rounded transition-colors">Remove due date</button>
                  )}
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <button className={SIDEBAR_BTN}><IconFlag className="h-3.5 w-3.5" />Priority</button>
                </PopoverTrigger>
                <PopoverContent className="p-3 w-44" align="end">
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Priority</p>
                  {(["low", "medium", "high", "critical"] as Priority[]).map((p) => (
                    <button key={p} onClick={() => update({ priority: p })}
                      className={cn("w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium mb-1 transition-all", PRIORITY_CONFIG[p].bg, PRIORITY_CONFIG[p].color, c.priority === p && "ring-2 ring-offset-1 ring-current")}>
                      <IconFlag className="h-3 w-3" />{PRIORITY_CONFIG[p].label}
                      {c.priority === p && <IconCheck className="h-3 w-3 ml-auto" />}
                    </button>
                  ))}
                  {c.priority && (
                    <button onClick={() => update({ priority: undefined })} className="w-full text-xs text-muted-foreground hover:text-foreground px-2 py-1 mt-1 rounded transition-colors">Remove priority</button>
                  )}
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <button className={SIDEBAR_BTN}><IconPalette className="h-3.5 w-3.5" />Cover</button>
                </PopoverTrigger>
                <PopoverContent className="p-3 w-52" align="end">
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Cover</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {COVER_COLORS.map((cc) => (
                      <button key={cc.value} title={cc.label} onClick={() => update({ cover_color: cc.value === c.cover_color ? undefined : cc.value })}
                        className={cn("h-7 w-full rounded transition-all", cc.value, c.cover_color === cc.value && "ring-2 ring-offset-1 ring-ring scale-105")} />
                    ))}
                  </div>
                  {c.cover_color && (
                    <button onClick={() => update({ cover_color: undefined })} className="w-full text-xs text-muted-foreground hover:text-foreground px-2 py-1 mt-2 rounded transition-colors">Remove cover</button>
                  )}
                </PopoverContent>
              </Popover>

              <Separator className="my-2" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Actions</p>
              <button onClick={() => setConfirmDelete(true)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium transition-colors text-destructive hover:bg-destructive/10">
                <IconTrash className="h-3.5 w-3.5" />Delete
              </button>
            </div>
          </div>
        </div>

        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="Delete this card?"
          description="All content, comments, and checklist items will be permanently deleted."
          onConfirm={handleDeleteCard}
        />
      </DialogContent>
    </Dialog>
  );
}
