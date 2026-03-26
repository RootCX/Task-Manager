import { useState, useRef, useEffect } from "react";
import { useAppCollection, useAppRecord } from "@rootcx/sdk";
import {
  Button,
  Dialog,
  DialogContent,
  Input,
  Label,
  Textarea,
  Separator,
  toast,
} from "@rootcx/ui";
import {
  IconX,
  IconTrash,
  IconCalendar,
  IconFlag,
  IconTag,
  IconChecklist,
  IconCheck,
  IconAlignLeft,
  IconMessage,
  IconEdit,
  IconClock,
  IconPalette,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardComment,
  ChecklistItem,
  LABEL_COLORS,
  PRIORITY_CONFIG,
  COVER_COLORS,
  Priority,
  LabelColor,
} from "@/types";
import { formatDate, isOverdue, isDueSoon, uid } from "@/lib/utils";

const APP_ID = "task_manager";

const PREDEFINED_LABELS: Array<{ color: LabelColor; name: string }> = [
  { color: "green", name: "Design" },
  { color: "yellow", name: "Review" },
  { color: "orange", name: "In Progress" },
  { color: "red", name: "Blocked" },
  { color: "purple", name: "Backend" },
  { color: "blue", name: "Frontend" },
  { color: "sky", name: "Research" },
  { color: "lime", name: "Done" },
  { color: "pink", name: "Marketing" },
  { color: "teal", name: "Onboarding" },
];

interface Props {
  cardId: string | null;
  listTitle: string;
  onClose: () => void;
  onCardDeleted?: () => void;
}

export default function CardDetailModal({ cardId, listTitle, onClose, onCardDeleted }: Props) {
  const { data: card, update, remove } = useAppRecord<Card>(APP_ID, "card", cardId);
  const { data: comments, create: createComment, remove: removeComment } =
    useAppCollection<CardComment>(APP_ID, "card_comment", {
      where: cardId ? { card_id: cardId } : undefined,
      orderBy: "created_at",
      order: "asc",
    });

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState("");
  const [commentValue, setCommentValue] = useState("");
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [newCheckItem, setNewCheckItem] = useState("");
  const [addingCheckItem, setAddingCheckItem] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);
  const checkItemRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (card) { setTitleValue(card.title); setDescValue(card.description || ""); }
  }, [card?.id]);

  useEffect(() => {
    if (editingTitle) setTimeout(() => titleInputRef.current?.focus(), 30);
  }, [editingTitle]);

  useEffect(() => {
    if (editingDesc) setTimeout(() => descTextareaRef.current?.focus(), 30);
  }, [editingDesc]);

  useEffect(() => {
    if (addingCheckItem) setTimeout(() => checkItemRef.current?.focus(), 30);
  }, [addingCheckItem]);

  if (!cardId || !card) return null;

  const checklist: ChecklistItem[] = card.checklist || [];
  const labels: string[] = card.labels || [];
  const checkedCount = checklist.filter((i) => i.checked).length;
  const checklistProgress = checklist.length
    ? Math.round((checkedCount / checklist.length) * 100)
    : 0;
  const overdue = isOverdue(card.due_date);
  const dueSoon = isDueSoon(card.due_date);

  async function saveTitle() {
    if (!titleValue.trim()) { setTitleValue(card!.title); setEditingTitle(false); return; }
    if (titleValue === card!.title) { setEditingTitle(false); return; }
    await update({ title: titleValue.trim() });
    setEditingTitle(false);
  }

  async function saveDesc() {
    await update({ description: descValue.trim() || undefined });
    setEditingDesc(false);
  }

  async function toggleLabel(labelStr: string) {
    const current = card!.labels || [];
    const next = current.includes(labelStr)
      ? current.filter((l) => l !== labelStr)
      : [...current, labelStr];
    await update({ labels: next });
  }

  async function setPriority(p: Priority | null) {
    await update({ priority: p ?? undefined });
    setShowPriorityPicker(false);
  }

  async function setDueDate(date: string) {
    await update({ due_date: date || undefined });
    setShowDatePicker(false);
  }

  async function setCoverColor(color: string) {
    await update({ cover_color: color === card!.cover_color ? undefined : color });
    setShowCoverPicker(false);
  }

  async function toggleCheckItem(itemId: string) {
    const next = checklist.map((i) => i.id === itemId ? { ...i, checked: !i.checked } : i);
    await update({ checklist: next });
  }

  async function addCheckItem() {
    if (!newCheckItem.trim()) return;
    const next = [...checklist, { id: uid(), text: newCheckItem.trim(), checked: false }];
    await update({ checklist: next });
    setNewCheckItem("");
  }

  async function deleteCheckItem(itemId: string) {
    await update({ checklist: checklist.filter((i) => i.id !== itemId) });
  }

  async function postComment() {
    if (!commentValue.trim()) return;
    await createComment({ card_id: card!.id, content: commentValue.trim(), author_name: "Me" });
    setCommentValue("");
  }

  async function handleDeleteCard() {
    await remove();
    toast.success("Card deleted");
    onCardDeleted?.();
    onClose();
  }

  return (
    <Dialog open={!!cardId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl w-full p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Cover strip */}
        {card.cover_color && (
          <div className={cn("h-8 w-full flex-shrink-0", card.cover_color)} />
        )}

        <div className="flex flex-col overflow-hidden">
          {/* Header */}
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
                    if (e.key === "Escape") { setTitleValue(card.title); setEditingTitle(false); }
                  }}
                />
              ) : (
                <h2
                  className="text-base font-semibold cursor-pointer hover:bg-muted rounded px-1 py-0.5 -mx-1 transition-colors"
                  onClick={() => setEditingTitle(true)}
                >
                  {card.title}
                </h2>
              )}
            </div>
            <button
              onClick={onClose}
              className="mt-1 p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-5 pb-5">
            <div className="flex gap-5 mt-4">
              {/* Main column */}
              <div className="flex-1 min-w-0 space-y-5">

                {/* Labels */}
                {labels.length > 0 && (
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Labels</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {labels.map((labelStr) => {
                        const [color, name] = labelStr.split(":");
                        const cfg = LABEL_COLORS[color as LabelColor];
                        return cfg ? (
                          <button
                            key={labelStr}
                            onClick={() => setShowLabelPicker(true)}
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
                              cfg.bg, cfg.text
                            )}
                          >
                            <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                            {name}
                          </button>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Priority + Due date */}
                {(card.priority || card.due_date) && (
                  <div className="flex gap-4 flex-wrap">
                    {card.priority && (
                      <div>
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1 block">Priority</Label>
                        <button
                          onClick={() => setShowPriorityPicker(true)}
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border transition-colors hover:opacity-80",
                            PRIORITY_CONFIG[card.priority].bg,
                            PRIORITY_CONFIG[card.priority].color
                          )}
                        >
                          <IconFlag className="h-3 w-3" />
                          {PRIORITY_CONFIG[card.priority].label}
                        </button>
                      </div>
                    )}
                    {card.due_date && (
                      <div>
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1 block">Due Date</Label>
                        <button
                          onClick={() => setShowDatePicker(true)}
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border transition-colors",
                            overdue
                              ? "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
                              : dueSoon
                              ? "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400"
                              : "bg-muted text-muted-foreground hover:bg-accent border-border"
                          )}
                        >
                          <IconClock className="h-3 w-3" />
                          {overdue && "Overdue · "}{formatDate(card.due_date)}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Description */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <IconAlignLeft className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Description</Label>
                    {!editingDesc && card.description && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto h-6 text-xs px-2"
                        onClick={() => setEditingDesc(true)}
                      >
                        <IconEdit className="h-3 w-3 mr-1" />Edit
                      </Button>
                    )}
                  </div>
                  {editingDesc ? (
                    <div className="space-y-2">
                      <Textarea
                        ref={descTextareaRef}
                        className="min-h-[80px] text-sm resize-none"
                        value={descValue}
                        onChange={(e) => setDescValue(e.target.value)}
                        placeholder="Add a more detailed description…"
                        onKeyDown={(e) => {
                          if (e.key === "Escape") { setDescValue(card.description || ""); setEditingDesc(false); }
                        }}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveDesc}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setDescValue(card.description || ""); setEditingDesc(false); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setEditingDesc(true)}
                      className={cn(
                        "text-sm rounded px-3 py-2 cursor-pointer min-h-[56px] border transition-colors",
                        card.description
                          ? "border-transparent hover:border-border hover:bg-muted text-foreground"
                          : "border-dashed border-border bg-muted/50 hover:bg-muted text-muted-foreground"
                      )}
                    >
                      {card.description || "Click to add a description…"}
                    </div>
                  )}
                </div>

                {/* Checklist */}
                {checklist.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <IconChecklist className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">Checklist</Label>
                      <span className="ml-auto text-xs text-muted-foreground">{checkedCount}/{checklist.length}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 bg-muted rounded-full mb-3 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-300", checklistProgress === 100 ? "bg-green-500" : "bg-primary")}
                        style={{ width: `${checklistProgress}%` }}
                      />
                    </div>
                    <div className="space-y-0.5">
                      {checklist.map((item) => (
                        <div key={item.id} className="flex items-start gap-2 group rounded px-1 py-0.5 hover:bg-muted transition-colors">
                          <button
                            onClick={() => toggleCheckItem(item.id)}
                            className={cn(
                              "mt-0.5 w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors",
                              item.checked ? "bg-primary border-primary" : "border-muted-foreground hover:border-primary"
                            )}
                          >
                            {item.checked && <IconCheck className="h-2.5 w-2.5 text-primary-foreground" />}
                          </button>
                          <span className={cn("text-sm flex-1", item.checked && "line-through text-muted-foreground")}>
                            {item.text}
                          </span>
                          <button
                            onClick={() => deleteCheckItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                          >
                            <IconX className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add checklist item */}
                {addingCheckItem && (
                  <div className="space-y-2">
                    <Input
                      ref={checkItemRef}
                      placeholder="Add an item…"
                      value={newCheckItem}
                      onChange={(e) => setNewCheckItem(e.target.value)}
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

                {/* Activity / Comments */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <IconMessage className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Activity</Label>
                  </div>

                  <div className="space-y-2 mb-4">
                    <Textarea
                      className="min-h-[56px] text-sm resize-none"
                      value={commentValue}
                      onChange={(e) => setCommentValue(e.target.value)}
                      placeholder="Write a comment… (Enter to post)"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); postComment(); }
                      }}
                    />
                    {commentValue && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={postComment}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setCommentValue("")}>Cancel</Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {comments.map((c) => (
                      <div key={c.id} className="flex gap-2 group">
                        <div className="w-7 h-7 rounded-full bg-muted border border-border text-xs font-semibold flex items-center justify-center flex-shrink-0 text-foreground">
                          {c.author_name[0]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-semibold">{c.author_name}</span>
                            <span className="text-xs text-muted-foreground">{formatDate(c.created_at)}</span>
                          </div>
                          <p className="text-sm mt-0.5 bg-muted rounded px-3 py-2 border border-border">{c.content}</p>
                        </div>
                        <button
                          onClick={() => removeComment(c.id)}
                          className="opacity-0 group-hover:opacity-100 self-start mt-1 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <IconTrash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="w-32 flex-shrink-0 space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Add to card</p>

                <ActionBtn icon={<IconTag className="h-3.5 w-3.5" />} label="Labels" onClick={() => setShowLabelPicker(!showLabelPicker)} />
                <ActionBtn icon={<IconChecklist className="h-3.5 w-3.5" />} label="Checklist" onClick={() => setAddingCheckItem(true)} />
                <ActionBtn icon={<IconCalendar className="h-3.5 w-3.5" />} label="Due Date" onClick={() => setShowDatePicker(!showDatePicker)} />
                <ActionBtn icon={<IconFlag className="h-3.5 w-3.5" />} label="Priority" onClick={() => setShowPriorityPicker(!showPriorityPicker)} />
                <ActionBtn icon={<IconPalette className="h-3.5 w-3.5" />} label="Cover" onClick={() => setShowCoverPicker(!showCoverPicker)} />

                <Separator className="my-2" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Actions</p>
                <ActionBtn icon={<IconTrash className="h-3.5 w-3.5" />} label="Delete" destructive onClick={() => setConfirmDelete(true)} />

                {/* Label picker */}
                {showLabelPicker && (
                  <div className="absolute right-4 bg-popover border border-border rounded-md shadow-md p-3 w-52 z-10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase">Labels</span>
                      <button onClick={() => setShowLabelPicker(false)} className="text-muted-foreground hover:text-foreground">
                        <IconX className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="space-y-1">
                      {PREDEFINED_LABELS.map(({ color, name }) => {
                        const labelStr = `${color}:${name}`;
                        const cfg = LABEL_COLORS[color];
                        const active = labels.includes(labelStr);
                        return (
                          <button
                            key={labelStr}
                            onClick={() => toggleLabel(labelStr)}
                            className={cn(
                              "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm font-medium transition-all",
                              cfg.bg, cfg.text,
                              active && "ring-2 ring-offset-1 ring-current"
                            )}
                          >
                            <span className={cn("w-3 h-3 rounded-full flex-shrink-0", cfg.dot)} />
                            {name}
                            {active && <IconCheck className="h-3.5 w-3.5 ml-auto" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Priority picker */}
                {showPriorityPicker && (
                  <div className="absolute right-4 bg-popover border border-border rounded-md shadow-md p-3 w-44 z-10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase">Priority</span>
                      <button onClick={() => setShowPriorityPicker(false)}>
                        <IconX className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                    {(["low", "medium", "high", "critical"] as Priority[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPriority(p)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium mb-1 transition-all",
                          PRIORITY_CONFIG[p].bg, PRIORITY_CONFIG[p].color,
                          card.priority === p && "ring-2 ring-offset-1 ring-current"
                        )}
                      >
                        <IconFlag className="h-3 w-3" />
                        {PRIORITY_CONFIG[p].label}
                        {card.priority === p && <IconCheck className="h-3 w-3 ml-auto" />}
                      </button>
                    ))}
                    {card.priority && (
                      <button onClick={() => setPriority(null)} className="w-full text-xs text-muted-foreground hover:text-foreground px-2 py-1 mt-1 rounded transition-colors">
                        Remove priority
                      </button>
                    )}
                  </div>
                )}

                {/* Date picker */}
                {showDatePicker && (
                  <div className="absolute right-4 bg-popover border border-border rounded-md shadow-md p-3 w-52 z-10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase">Due Date</span>
                      <button onClick={() => setShowDatePicker(false)}>
                        <IconX className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                    <Input
                      type="date"
                      className="text-sm"
                      value={card.due_date || ""}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                    {card.due_date && (
                      <button onClick={() => setDueDate("")} className="w-full text-xs text-muted-foreground hover:text-foreground px-2 py-1 mt-1 rounded transition-colors">
                        Remove due date
                      </button>
                    )}
                  </div>
                )}

                {/* Cover picker */}
                {showCoverPicker && (
                  <div className="absolute right-4 bg-popover border border-border rounded-md shadow-md p-3 w-52 z-10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase">Cover</span>
                      <button onClick={() => setShowCoverPicker(false)}>
                        <IconX className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {COVER_COLORS.map((c) => (
                        <button
                          key={c.value}
                          title={c.label}
                          onClick={() => setCoverColor(c.value)}
                          className={cn(
                            "h-7 w-full rounded transition-all",
                            c.value,
                            card.cover_color === c.value && "ring-2 ring-offset-1 ring-ring scale-105"
                          )}
                        />
                      ))}
                    </div>
                    {card.cover_color && (
                      <button onClick={() => setCoverColor("")} className="w-full text-xs text-muted-foreground hover:text-foreground px-2 py-1 mt-2 rounded transition-colors">
                        Remove cover
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delete confirm overlay */}
        {confirmDelete && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="bg-card border border-border rounded-lg p-5 shadow-lg max-w-xs mx-4">
              <h3 className="font-semibold mb-1.5">Delete this card?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                All content, comments, and checklist items will be permanently deleted.
              </p>
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" className="flex-1" onClick={handleDeleteCard}>Delete</Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ActionBtn({ icon, label, onClick, destructive }: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium transition-colors",
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
