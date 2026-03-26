import { useState, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@rootcx/ui";
import { cn } from "@/lib/utils";
import { Card, List } from "@/types";
import KanbanCard, { CardDropPlaceholder } from "./KanbanCard";
import { IconPlus, IconX, IconDots, IconTrash, IconEdit, IconCopy } from "@tabler/icons-react";

interface Props {
  list: List;
  cards: Card[];
  commentCounts: Record<string, number>;
  onCardOpen: (id: string) => void;
  onCardTitleSave: (id: string, title: string) => void;
  onCardCreate: (listId: string, title: string) => void;
  onListUpdate: (id: string, title: string) => void;
  onListDelete: (id: string) => void;
  onListDuplicate: (id: string) => void;
  isOver?: boolean;
}

export default function KanbanList({
  list,
  cards,
  commentCounts,
  onCardOpen,
  onCardTitleSave,
  onCardCreate,
  onListUpdate,
  onListDelete,
  onListDuplicate,
}: Props) {
  const {
    attributes: listAttrs,
    listeners: listListeners,
    setNodeRef: setListRef,
    transform: listTransform,
    transition: listTransition,
    isDragging: listIsDragging,
  } = useSortable({
    id: `list:${list.id}`,
    data: { type: "list", list },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: list.id,
    data: { type: "list", list },
  });

  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(list.title);
  const [showMenu, setShowMenu] = useState(false);

  const addInputRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (addingCard) setTimeout(() => addInputRef.current?.focus(), 30);
  }, [addingCard]);

  useEffect(() => {
    if (editingTitle) setTimeout(() => { titleInputRef.current?.focus(); titleInputRef.current?.select(); }, 30);
  }, [editingTitle]);

  useEffect(() => {
    if (!showMenu) return;
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showMenu]);

  const listStyle = {
    transform: CSS.Transform.toString(listTransform),
    transition: listTransition,
  };

  function handleAddCard() {
    if (!newCardTitle.trim()) { setAddingCard(false); return; }
    onCardCreate(list.id, newCardTitle.trim());
    setNewCardTitle("");
    setTimeout(() => addInputRef.current?.focus(), 30);
  }

  function handleTitleSave() {
    if (titleValue.trim() && titleValue !== list.title) onListUpdate(list.id, titleValue.trim());
    else setTitleValue(list.title);
    setEditingTitle(false);
  }

  if (listIsDragging) {
    return (
      <div
        ref={setListRef}
        style={listStyle}
        className="w-64 flex-shrink-0 h-16 rounded-lg bg-muted border-2 border-dashed border-border"
      />
    );
  }

  return (
    <div ref={setListRef} style={listStyle} className="w-64 flex-shrink-0 flex flex-col max-h-full">
      <div
        className={cn(
          "flex flex-col rounded-lg bg-muted border border-border transition-colors max-h-full",
          isOver && "border-primary ring-1 ring-primary"
        )}
      >
        {/* Header */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-2 cursor-grab active:cursor-grabbing"
          {...listAttrs}
          {...listListeners}
        >
          {editingTitle ? (
            <input
              ref={titleInputRef}
              className="flex-1 text-sm font-medium bg-background border border-border rounded px-1.5 py-0.5 outline-none focus:ring-1 ring-ring min-w-0"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSave();
                if (e.key === "Escape") { setTitleValue(list.title); setEditingTitle(false); }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3
              className="flex-1 text-sm font-medium text-foreground min-w-0 truncate"
              onDoubleClick={(e) => { e.stopPropagation(); setEditingTitle(true); }}
            >
              {list.title}
            </h3>
          )}

          <span className="text-xs text-muted-foreground tabular-nums">
            {cards.length}
          </span>

          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-0.5 rounded hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
            >
              <IconDots className="h-4 w-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-popover border border-border rounded-md shadow-md z-30 py-1 overflow-hidden">
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                  onClick={() => { setEditingTitle(true); setShowMenu(false); }}
                >
                  <IconEdit className="h-3.5 w-3.5 text-muted-foreground" />
                  Rename list
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                  onClick={() => { setAddingCard(true); setShowMenu(false); }}
                >
                  <IconPlus className="h-3.5 w-3.5 text-muted-foreground" />
                  Add card
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                  onClick={() => { onListDuplicate(list.id); setShowMenu(false); }}
                >
                  <IconCopy className="h-3.5 w-3.5 text-muted-foreground" />
                  Duplicate list
                </button>
                <div className="border-t border-border my-1" />
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => { onListDelete(list.id); setShowMenu(false); }}
                >
                  <IconTrash className="h-3.5 w-3.5" />
                  Delete list
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Cards */}
        <div
          ref={setDropRef}
          className="flex-1 overflow-y-auto px-2 pb-1 space-y-1.5 min-h-[4px] max-h-[calc(100vh-200px)]"
          style={{ scrollbarWidth: "thin" }}
        >
          <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {cards.map((card) => (
              <KanbanCard
                key={card.id}
                card={card}
                commentCount={commentCounts[card.id] || 0}
                onOpen={onCardOpen}
                onTitleSave={onCardTitleSave}
              />
            ))}
          </SortableContext>

          {cards.length === 0 && isOver && <CardDropPlaceholder />}

          {cards.length === 0 && !isOver && (
            <button
              className="w-full h-12 rounded border-2 border-dashed border-border text-xs text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all"
              onClick={() => setAddingCard(true)}
            >
              + Add a card
            </button>
          )}
        </div>

        {/* Add card form */}
        {addingCard ? (
          <div className="px-2 pb-2 pt-1 space-y-1.5">
            <textarea
              ref={addInputRef}
              className="w-full text-sm bg-background border border-border rounded px-2.5 py-1.5 outline-none focus:ring-1 ring-ring resize-none"
              placeholder="Card title…"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddCard(); }
                if (e.key === "Escape") { setNewCardTitle(""); setAddingCard(false); }
              }}
            />
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                className="flex-1 h-7 text-xs"
                disabled={!newCardTitle.trim()}
                onClick={handleAddCard}
              >
                Add card
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => { setNewCardTitle(""); setAddingCard(false); }}
              >
                <IconX className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingCard(true)}
            className="mx-2 mb-2 mt-0.5 flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
          >
            <IconPlus className="h-3.5 w-3.5" />
            Add a card
          </button>
        )}
      </div>
    </div>
  );
}
