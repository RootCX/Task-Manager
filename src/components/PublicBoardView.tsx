import { useEffect, useMemo, useState } from "react";
import { RuntimeClient } from "@rootcx/sdk";
import { IconLayoutKanban, IconLock, IconWorld } from "@tabler/icons-react";
import { byPosition } from "@/lib/utils";
import type { Board, Card, CardComment, CardAssignee, List, OrgUser } from "@/types";
import { ReadOnlyList } from "./ReadOnlyList";
import { ReadOnlyCardDetail } from "./ReadOnlyCardDetail";

const APP_ID = "task_manager";

interface PublicBoardResponse {
  board: Pick<Board, "id" | "title" | "description" | "color">;
  lists: List[];
  cards: Card[];
  comments: CardComment[];
}

export default function PublicBoardView({ token }: { token: string }) {
  const client = useMemo(
    () => new RuntimeClient({ accessToken: token, persist: false, autoRefresh: false }),
    [token],
  );

  const [data, setData] = useState<PublicBoardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const info = await client.getPublicShareInfo();
        if (info.appId !== APP_ID) {
          setError("This link belongs to another app.");
          return;
        }
        const boardId = (info.context as { board_id?: string })?.board_id;
        if (!boardId) {
          setError("This share link is malformed.");
          return;
        }
        const result = (await client.rpc(APP_ID, "get_public_board", { board_id: boardId })) as PublicBoardResponse;
        setData(result);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
          setError("This share link has been revoked or doesn't exist.");
        } else {
          setError(`Failed to load: ${msg}`);
        }
      }
    })();
  }, [client]);

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-6">
          <IconLock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-xl font-semibold mb-2">Link unavailable</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading shared board…</div>
      </div>
    );
  }

  const lists = [...data.lists].sort(byPosition);
  const cards = [...data.cards].sort(byPosition);

  const commentCounts: Record<string, number> = {};
  for (const c of data.comments) commentCounts[c.card_id] = (commentCounts[c.card_id] || 0) + 1;

  const assigneesByCard: Record<string, CardAssignee[]> = {};
  // Public share doesn't expose assignees (user_id is sensitive) — empty map

  const cardsByList: Record<string, Card[]> = {};
  for (const card of cards) (cardsByList[card.list_id] ||= []).push(card);

  const selectedCard = selectedCardId ? cards.find(c => c.id === selectedCardId) : null;
  const selectedCardList = selectedCard ? lists.find(l => l.id === selectedCard.list_id) : null;
  const selectedCardComments = selectedCardId
    ? data.comments.filter(c => c.card_id === selectedCardId)
    : [];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <header className="flex items-center gap-3 px-4 h-12 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-2">
          <IconLayoutKanban className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Kanban</span>
        </div>
        <span className="text-border text-sm">/</span>
        <span className="text-sm font-semibold truncate max-w-[280px]">{data.board.title}</span>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <IconWorld className="h-3 w-3" />
          Read-only
        </span>
      </header>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 p-4 h-full min-w-fit">
          {lists.map(list => (
            <ReadOnlyList
              key={list.id}
              list={list}
              cards={cardsByList[list.id] || []}
              commentCounts={commentCounts}
              assigneesByCard={assigneesByCard}
              orgUsers={[]}
              onCardOpen={setSelectedCardId}
            />
          ))}
          {lists.length === 0 && (
            <div className="text-sm text-muted-foreground italic m-auto">This board is empty.</div>
          )}
        </div>
      </div>

      {selectedCard && (
        <ReadOnlyCardDetail
          card={selectedCard}
          listTitle={selectedCardList?.title || ""}
          comments={selectedCardComments}
          onClose={() => setSelectedCardId(null)}
        />
      )}
    </div>
  );
}
