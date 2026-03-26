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
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(board.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitleValue(board.title);
  }, [board.title]);

  useEffect(() => {
    if (editingTitle)
      setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 30);
  }, [editingTitle]);

  async function saveTitle() {
    if (!titleValue.trim() || titleValue === board.title) {
      setTitleValue(board.title);
      setEditingTitle(false);
      return;
    }
    try {
      const updated = await update(board.id, { title: titleValue.trim() });
      onBoardUpdated(updated);
      setEditingTitle(false);
    } catch {
      toast.error("Failed to rename board");
      setTitleValue(board.title);
      setEditingTitle(false);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <IconArrowLeft className="h-3.5 w-3.5" />
        Boards
      </button>
      <span className="text-border text-sm">/</span>
      {editingTitle ? (
        <input
          ref={inputRef}
          className="text-sm font-semibold bg-muted rounded px-2 py-0.5 outline-none focus:ring-2 ring-ring min-w-[120px] max-w-[280px]"
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveTitle();
            if (e.key === "Escape") { setTitleValue(board.title); setEditingTitle(false); }
          }}
        />
      ) : (
        <button
          onClick={() => setEditingTitle(true)}
          className="text-sm font-semibold text-foreground hover:bg-muted rounded px-2 py-0.5 transition-colors truncate max-w-[280px]"
          title="Click to rename"
        >
          {board.title}
        </button>
      )}
    </div>
  );
}
