import { useState, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Card, List, CardComment } from "@/types";
import KanbanCard, { CardDropPlaceholder } from "./KanbanCard";
import {
  IconPlus,
  IconX,
  IconDots,
  IconTrash,
  IconEdit,
  IconCopy,
  IconSortAscending,
} from "@tabler/icons-react";

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
    if (editingTitle) setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }, 30);
  }, [editingTitle]);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showMenu]);

  const listStyle = {
    transform: CSS.Transform.toString(listTransform),
    transition: listTransition,
  };

  function handleAddCard() {
    if (!newCardTitle.trim()) {
      setAddingCard(false);
      return;
    }
    onCardCreate(list.id, newCardTitle.trim());
    setNewCardTitle("");
    // Keep form open for quick successive adds
    setTimeout(() => addInputRef.current?.focus(), 30);
  }

  function handleTitleSave() {
    if (titleValue.trim() && titleValue !== list.title) {
      onListUpdate(list.id, titleValue.trim());
    } else {
      setTitleValue(list.title);
    }
    setEditingTitle(false);
  }

  if (listIsDragging) {
    return (
      <div
        ref={setListRef}
        style={listStyle}
        className="w-72 flex-shrink-0 h-20 rounded-2xl bg-primary/10 border-2 border-dashed border-primary/30"
      />
    );
  }

  return (
    <div
      ref={setListRef}
      style={listStyle}
      className="w-72 flex-shrink-0 flex flex-col max-h-full"
    >
      {/* List container */}
      <div
        className={cn(
          "flex flex-col rounded-2xl bg-muted/60 backdrop-blur-sm border border-border/50",
          "transition-all duration-150 max-h-full",
          isOver && "ring-2 ring-primary/50 bg-primary/5"
        )}
      >
        {/* List header — drag handle */}
        <div
          className="flex items-center gap-2 px-3 py-2.5 cursor-grab active:cursor-grabbing"
          {...listAttrs}
          {...listListeners}
        >
          {/* Color accent */}
          {list.color && (
            <div
              className={cn("w-1.5 h-5 rounded-full flex-shrink-0", list.color)}
            />
          )}

          {editingTitle ? (
            <input
              ref={titleInputRef}
              className="flex-1 text-sm font-semibold bg-background rounded px-1.5 py-0.5 outline-none focus:ring-2 ring-primary min-w-0"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSave();
                if (e.key === "Escape") {
                  setTitleValue(list.title);
                  setEditingTitle(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3
              className="flex-1 text-sm font-semibold text-foreground min-w-0 truncate cursor-pointer hover:text-primary transition-colors"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingTitle(true);
              }}
            >
              {list.title}
            </h3>
          )}

          {/* Card count badge */}
          <span className="text-xs text-muted-foreground bg-background/80 rounded-full px-1.5 py-0.5 font-medium min-w-[20px] text-center">
            {cards.length}
          </span>

          {/* Menu button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 rounded-md hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
            >
              <IconDots className="h-4 w-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-xl shadow-xl z-30 py-1 overflow-hidden">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                  onClick={() => {
                    setEditingTitle(true);
                    setShowMenu(false);
                  }}
                >
                  <IconEdit className="h-4 w-4 text-muted-foreground" />
                  Rename list
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                  onClick={() => {
                    setAddingCard(true);
                    setShowMenu(false);
                  }}
                >
                  <IconPlus className="h-4 w-4 text-muted-foreground" />
                  Add card
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                  onClick={() => {
                    onListDuplicate(list.id);
                    setShowMenu(false);
                  }}
                >
                  <IconCopy className="h-4 w-4 text-muted-foreground" />
                  Duplicate list
                </button>
                <div className="border-t border-border my-1" />
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  onClick={() => {
                    onListDelete(list.id);
                    setShowMenu(false);
                  }}
                >
                  <IconTrash className="h-4 w-4" />
                  Delete list
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Cards scroll area */}
        <div
          ref={setDropRef}
          className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-[2px] max-h-[calc(100vh-240px)]"
          style={{ scrollbarWidth: "thin" }}
        >
          <SortableContext
            items={cards.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
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

          {/* Drop placeholder for empty list */}
          {cards.length === 0 && isOver && <CardDropPlaceholder />}

          {/* Empty state */}
          {cards.length === 0 && !isOver && (
            <div
              className="h-16 rounded-xl border-2 border-dashed border-border/40 flex items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all group"
              onClick={() => setAddingCard(true)}
            >
              <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                + Add a card
              </span>
            </div>
          )}
        </div>

        {/* Add card form */}
        {addingCard ? (
          <div className="px-2 pb-2 space-y-1.5">
            <textarea
              ref={addInputRef}
              className="w-full text-sm bg-card rounded-xl px-3 py-2 outline-none focus:ring-2 ring-primary resize-none shadow-sm border border-border"
              placeholder="Card title… (Enter to add)"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAddCard();
                }
                if (e.key === "Escape") {
                  setNewCardTitle("");
                  setAddingCard(false);
                }
              }}
            />
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleAddCard}
                disabled={!newCardTitle.trim()}
                className="flex-1 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add card
              </button>
              <button
                onClick={() => {
                  setNewCardTitle("");
                  setAddingCard(false);
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Add card button */
          <button
            onClick={() => setAddingCard(true)}
            className="mx-2 mb-2 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background/60 transition-all group"
          >
            <IconPlus className="h-3.5 w-3.5 group-hover:text-primary transition-colors" />
            Add a card
          </button>
        )}
      </div>
    </div>
  );
}
