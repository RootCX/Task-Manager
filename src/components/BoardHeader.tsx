import { useState, useRef, useEffect } from "react";
import { useAppCollection } from "@rootcx/sdk";
import { toast } from "@rootcx/ui";
import { IconArrowLeft } from "@tabler/icons-react";
import { Board } from "@/types";

const APP_ID = "task_manager";

interface Props {
  board: Board;
  onBack: () => void;
  onBoardUpdated: (board: Board) => void;
}

export default function BoardHeader({ board, onBack, onBoardUpdated }: Props) {
  const { update } = useAppCollection<Board>(APP_ID, "board");
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(board.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setValue(board.title); }, [board.title]);
  useEffect(() => {
    if (editing) setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 30);
  }, [editing]);

  async function save() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === board.title) { setValue(board.title); setEditing(false); return; }
    try {
      onBoardUpdated(await update(board.id, { title: trimmed }));
      setEditing(false);
    } catch {
      toast.error("Failed to rename board");
      setValue(board.title);
      setEditing(false);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <IconArrowLeft className="h-3.5 w-3.5" />Boards
      </button>
      <span className="text-border text-sm">/</span>
      {editing ? (
        <input
          ref={inputRef}
          className="text-sm font-semibold bg-muted rounded px-2 py-0.5 outline-none focus:ring-2 ring-ring min-w-[120px] max-w-[280px]"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") { setValue(board.title); setEditing(false); }
          }}
        />
      ) : (
        <button onClick={() => setEditing(true)} className="text-sm font-semibold hover:bg-muted rounded px-2 py-0.5 transition-colors truncate max-w-[280px]" title="Click to rename">
          {board.title}
        </button>
      )}
    </div>
  );
}
