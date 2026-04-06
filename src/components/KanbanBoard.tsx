import { useState, useCallback, useMemo, useEffect } from "react";
import {
  DndContext, DragOverlay, DragStartEvent, DragOverEvent, DragEndEvent,
  PointerSensor, KeyboardSensor, useSensor, useSensors,
  closestCorners, pointerWithin, rectIntersection,
  UniqueIdentifier, CollisionDetection,
} from "@dnd-kit/core";
import {
  SortableContext, horizontalListSortingStrategy,
  arrayMove, sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useAppCollection, useCoreCollection } from "@rootcx/sdk";
import { Board, List, Card, CardComment, CardAssignee, OrgUser } from "@/types";
import { byPosition, computePosition } from "@/lib/utils";
import KanbanList from "./KanbanList";
import KanbanCard from "./KanbanCard";
import CardDetailModal from "./CardDetailModal";
import AddListButton from "./AddListButton";

const APP_ID = "task_manager";

export default function KanbanBoard({ board, currentUserId }: { board: Board; currentUserId: string }) {
  const {
    data: listsRaw, loading: listsLoading,
    create: createList, update: updateList, remove: removeList,
  } = useAppCollection<List>(APP_ID, "list", {
    where: { board_id: board.id }, orderBy: "position", order: "asc",
  });

  const {
    data: cardsRaw, loading: cardsLoading,
    create: createCard, update: updateCard, remove: removeCard,
  } = useAppCollection<Card>(APP_ID, "card", {
    where: { board_id: board.id, $or: [{ archived: false }, { archived: null }] },
    orderBy: "position", order: "asc",
  });

  // Fetch all comments unscoped — filtered client-side via commentCounts memo
  const { data: comments, remove: removeComment } = useAppCollection<CardComment>(APP_ID, "card_comment");

  const {
    data: allAssignees, create: createAssignee, remove: removeAssignee,
  } = useAppCollection<CardAssignee>(APP_ID, "card_assignee");

  const { data: orgUsers } = useCoreCollection<OrgUser>("users");

  const [lists, setLists] = useState<List[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeType, setActiveType] = useState<"card" | "list" | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  useEffect(() => { setLists([...listsRaw].sort(byPosition)); }, [listsRaw]);
  useEffect(() => { setCards([...cardsRaw].sort(byPosition)); }, [cardsRaw]);

  const commentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of comments) counts[c.card_id] = (counts[c.card_id] || 0) + 1;
    return counts;
  }, [comments]);

  const assigneesByCard = useMemo(() => {
    const grouped: Record<string, CardAssignee[]> = {};
    for (const a of allAssignees) {
      (grouped[a.card_id] ??= []).push(a);
    }
    return grouped;
  }, [allAssignees]);

  const cardsByList = useMemo(() => {
    const grouped: Record<string, Card[]> = {};
    for (const l of lists) grouped[l.id] = cards.filter((c) => c.list_id === l.id).sort(byPosition);
    return grouped;
  }, [lists, cards]);

  const activeCard = useMemo(
    () => (activeType === "card" ? cards.find((c) => c.id === activeId) ?? null : null),
    [activeId, activeType, cards]
  );
  const activeList = useMemo(
    () => (activeType === "list" ? lists.find((l) => `list:${l.id}` === activeId) ?? null : null),
    [activeId, activeType, lists]
  );

  const selectedCardListTitle = useMemo(() => {
    if (!selectedCardId) return "";
    const card = cards.find((c) => c.id === selectedCardId);
    return card ? (lists.find((l) => l.id === card.list_id)?.title ?? "") : "";
  }, [selectedCardId, cards, lists]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const collisionDetection: CollisionDetection = useCallback((args) => {
    if (activeType === "list") return closestCorners(args);
    const hits = pointerWithin(args);
    return hits.length > 0 ? hits : rectIntersection(args);
  }, [activeType]);

  function onDragStart({ active }: DragStartEvent) {
    setActiveType(active.data.current?.type === "list" ? "list" : "card");
    setActiveId(active.id);
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over || activeType !== "card") return;
    const activeCardId = active.id as string;
    const overId = over.id as string;
    const overData = over.data.current;
    const targetListId: string =
      overData?.type === "list" ? overData.list.id :
      overData?.type === "card" ? overData.card.list_id : "";
    if (!targetListId) return;

    const ac = cards.find((c) => c.id === activeCardId);
    if (!ac || (ac.list_id === targetListId && activeCardId === overId)) return;

    setCards((prev) => {
      const updated = prev.map((c) => c.id === activeCardId ? { ...c, list_id: targetListId } : c);
      const targetCards = updated.filter((c) => c.list_id === targetListId).sort(byPosition);
      const ai = targetCards.findIndex((c) => c.id === activeCardId);
      const oi = targetCards.findIndex((c) => c.id === overId);
      if (ai !== -1 && oi !== -1 && ai !== oi) {
        const reordered = arrayMove(targetCards, ai, oi);
        return [...updated.filter((c) => c.list_id !== targetListId), ...reordered];
      }
      return updated;
    });
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    setActiveType(null);
    if (!over) return;

    if (activeType === "list") {
      const aid = (active.id as string).replace("list:", "");
      const oid = (over.id as string).replace("list:", "");
      if (aid === oid) return;
      const oi = lists.findIndex((l) => l.id === oid);
      const ai = lists.findIndex((l) => l.id === aid);
      if (ai === -1 || oi === -1) return;
      const reordered = arrayMove(lists, ai, oi);
      setLists(reordered);
      try {
        await updateList(aid, { position: computePosition(reordered[oi - 1]?.position, reordered[oi + 1]?.position) });
      } catch {
        setLists([...listsRaw].sort(byPosition));
      }
      return;
    }

    const activeCardId = active.id as string;
    const card = cards.find((c) => c.id === activeCardId);
    if (!card) return;
    const listCards = cards.filter((c) => c.list_id === card.list_id).sort(byPosition);
    const ci = listCards.findIndex((c) => c.id === activeCardId);
    try {
      await updateCard(activeCardId, {
        list_id: card.list_id,
        position: computePosition(listCards[ci - 1]?.position, listCards[ci + 1]?.position),
      });
    } catch {
      setCards([...cardsRaw].sort(byPosition));
    }
  }

  async function handleDuplicateList(id: string) {
    const list = lists.find((l) => l.id === id);
    if (!list) return;
    const newList = await createList({ title: `${list.title} (copy)`, board_id: board.id, position: list.position + 1 });
    for (const card of cards.filter((c) => c.list_id === id)) {
      await createCard({ title: card.title, description: card.description, list_id: newList.id, board_id: board.id, position: card.position, labels: card.labels, priority: card.priority, due_date: card.due_date, archived: false });
    }
  }

  // Idempotent — prevents duplicate assignments
  async function toggleAssignee(cardId: string, userId: string) {
    const existing = (assigneesByCard[cardId] || []).find((a) => a.user_id === userId);
    if (existing) await removeAssignee(existing.id);
    else await createAssignee({ card_id: cardId, user_id: userId });
  }

  async function handleDeleteCard(cardId: string) {
    // Optimistic removal for instant UI feedback
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    setSelectedCardId(null);
    // Children must be deleted first — FK card_id is NOT NULL, ON DELETE SET NULL would violate it
    await Promise.all([
      ...comments.filter((c) => c.card_id === cardId).map((c) => removeComment(c.id)),
      ...(assigneesByCard[cardId] ?? []).map((a) => removeAssignee(a.id)),
    ]);
    await removeCard(cardId);
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && selectedCardId) setSelectedCardId(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedCardId]);

  if (listsLoading || cardsLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-x-auto overflow-y-hidden" style={{ scrollbarWidth: "thin" }}>
        <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
          <SortableContext items={lists.map((l) => `list:${l.id}`)} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-3 p-4 h-full items-start min-w-max">
              {lists.map((list) => (
                <KanbanList
                  key={list.id}
                  list={list}
                  cards={cardsByList[list.id] || []}
                  commentCounts={commentCounts}
                  assigneesByCard={assigneesByCard}
                  orgUsers={orgUsers}
                  onCardOpen={setSelectedCardId}
                  onCardTitleSave={(id, title) => updateCard(id, { title })}
                  onCardCreate={(listId, title) => {
                    const maxPos = cards.filter((c) => c.list_id === listId).reduce((m, c) => Math.max(m, c.position), 0);
                    return createCard({ title, list_id: listId, board_id: board.id, position: maxPos + 65536, archived: false });
                  }}
                  onListUpdate={(id, title) => updateList(id, { title })}
                  onListDelete={removeList}
                  onListDuplicate={handleDuplicateList}
                  onSpaceAssign={(cardId) => toggleAssignee(cardId, currentUserId)}
                />
              ))}
              <AddListButton onCreate={(title) => {
                const maxPos = lists.reduce((m, l) => Math.max(m, l.position), 0);
                return createList({ title, board_id: board.id, position: maxPos + 65536 });
              }} />
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
            {activeType === "card" && activeCard && (
              <div className="rotate-1 scale-105 opacity-95 w-64 shadow-lg">
                <KanbanCard card={activeCard} commentCount={commentCounts[activeCard.id] || 0} assignees={assigneesByCard[activeCard.id] || []} orgUsers={orgUsers} onOpen={() => {}} onTitleSave={() => {}} onSpaceAssign={() => {}} isDragging />
              </div>
            )}
            {activeType === "list" && activeList && (
              <div className="opacity-90 rotate-1 w-64 shadow-lg">
                <div className="rounded-lg bg-muted border border-border px-2.5 py-2">
                  <p className="text-sm font-medium">{activeList.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{cardsByList[activeList.id]?.length || 0} cards</p>
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      <CardDetailModal
        cardId={selectedCardId}
        listTitle={selectedCardListTitle}
        currentUserId={currentUserId}
        orgUsers={orgUsers}
        assignees={selectedCardId ? (assigneesByCard[selectedCardId] || []) : []}
        onAssigneeToggle={toggleAssignee}
        onDeleteCard={handleDeleteCard}
        onClose={() => setSelectedCardId(null)}
      />
    </div>
  );
}
