import { cn } from "@/lib/utils";
import { Card, List, CardAssignee, OrgUser } from "@/types";
import { ReadOnlyCard } from "./ReadOnlyCard";

interface Props {
  list: List;
  cards: Card[];
  commentCounts: Record<string, number>;
  assigneesByCard: Record<string, CardAssignee[]>;
  orgUsers: OrgUser[];
  onCardOpen?: (id: string) => void;
}

export function ReadOnlyList({ list, cards, commentCounts, assigneesByCard, orgUsers, onCardOpen }: Props) {
  return (
    <div className="w-64 flex-shrink-0 flex flex-col max-h-full">
      <div className="flex flex-col rounded-lg bg-muted border border-border max-h-full">
        {/* Header */}
        <div className="flex items-center gap-1.5 px-2.5 py-2">
          <h3 className="flex-1 text-sm font-medium text-foreground min-w-0 truncate">
            {list.title}
          </h3>
          <span className="text-xs text-muted-foreground tabular-nums">
            {cards.length}
          </span>
        </div>

        {/* Cards */}
        <div
          className="flex-1 overflow-y-auto px-2 pb-2 space-y-1.5 min-h-[4px] max-h-[calc(100vh-200px)]"
          style={{ scrollbarWidth: "thin" }}
        >
          {cards.map((card) => (
            <ReadOnlyCard
              key={card.id}
              card={card}
              commentCount={commentCounts[card.id] || 0}
              assignees={assigneesByCard[card.id] || []}
              orgUsers={orgUsers}
              onOpen={onCardOpen}
            />
          ))}
          {cards.length === 0 && (
            <div className="text-xs text-muted-foreground italic px-1 py-2">No cards</div>
          )}
        </div>
      </div>
    </div>
  );
}
