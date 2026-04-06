import { useState, useRef, useEffect } from "react";
import { useAppCollection } from "@rootcx/sdk";
import { Input } from "@rootcx/ui";
import { IconSearch, IconCheck, IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { CardAssignee, OrgUser } from "@/types";

const APP_ID = "task_manager";

// Returns initials from email or full_name
function getInitials(user: OrgUser): string {
  if (user.full_name) {
    const parts = user.full_name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return user.email.slice(0, 2).toUpperCase();
}

export function getDisplayName(user: OrgUser): string {
  return user.full_name || user.username || user.email;
}

// Deterministic color from user id
const AVATAR_COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500",
  "bg-pink-500", "bg-teal-500", "bg-rose-500", "bg-indigo-500",
];
function avatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ── Avatar chip (exported for use in CardDetailModal & KanbanCard) ───────────
export function UserAvatar({ user, size = "sm" }: { user: OrgUser; size?: "xs" | "sm" }) {
  const dim = size === "xs" ? "w-5 h-5 text-[9px]" : "w-6 h-6 text-[10px]";
  return (
    <div
      title={getDisplayName(user)}
      className={cn(
        "rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 border-2 border-background",
        avatarColor(user.id),
        dim
      )}
    >
      {getInitials(user)}
    </div>
  );
}

// ── Stacked avatars on the card ─────────────────────────────────────────────
export function AssigneeAvatars({ assignees, users }: { assignees: CardAssignee[]; users: OrgUser[] }) {
  if (assignees.length === 0) return null;
  const userMap = new Map(users.map((u) => [u.id, u]));
  const visible = assignees.slice(0, 3);
  const extra = assignees.length - visible.length;

  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((a) => {
        const u = userMap.get(a.user_id);
        return u ? <UserAvatar key={a.id} user={u} size="xs" /> : null;
      })}
      {extra > 0 && (
        <div className="w-5 h-5 rounded-full bg-muted border-2 border-background text-[9px] font-semibold flex items-center justify-center text-muted-foreground">
          +{extra}
        </div>
      )}
    </div>
  );
}

// ── Full member picker panel ─────────────────────────────────────────────────
interface Props {
  cardId: string;
  currentUserId: string;
  orgUsers: OrgUser[];
  onClose: () => void;
}

export default function MemberPicker({ cardId, currentUserId, orgUsers, onClose }: Props) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Current assignees for this card
  const {
    data: assignees,
    create: addAssignee,
    remove: removeAssignee,
  } = useAppCollection<CardAssignee>(APP_ID, "card_assignee", {
    where: { card_id: cardId },
  });

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 30);
  }, []);

  const assignedUserIds = new Set(assignees.map((a) => a.user_id));

  const filtered = orgUsers.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.full_name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q)
    );
  });

  async function toggle(userId: string) {
    if (assignedUserIds.has(userId)) {
      const row = assignees.find((a) => a.user_id === userId);
      if (row) await removeAssignee(row.id);
    } else {
      await addAssignee({ card_id: cardId, user_id: userId });
    }
  }

  return (
    <div className="bg-popover p-3 w-60">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Members</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <IconX className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="relative mb-2">
        <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          className="h-7 pl-7 text-xs"
          placeholder="Search members…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Self-assign shortcut hint */}
      <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
        <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px] font-mono">Space</kbd>
        to assign yourself
      </p>

      <div className="space-y-0.5 max-h-48 overflow-y-auto">
        {orgUsers.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-3">No members available</p>
        )}
        {filtered.length === 0 && orgUsers.length > 0 && (
          <p className="text-xs text-muted-foreground text-center py-3">No members found</p>
        )}
        {filtered.map((u) => {
          const assigned = assignedUserIds.has(u.id);
          const isMe = u.id === currentUserId;
          return (
            <button
              key={u.id}
              onClick={() => toggle(u.id)}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors",
                assigned ? "bg-primary/10" : "hover:bg-muted"
              )}
            >
              <UserAvatar user={u} size="sm" />
              <span className="flex-1 text-left text-xs truncate">
                {getDisplayName(u)}
                {isMe && <span className="ml-1 text-muted-foreground">(you)</span>}
              </span>
              {assigned && <IconCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
