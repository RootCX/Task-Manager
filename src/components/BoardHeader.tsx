import { useState, useRef, useEffect } from "react";
import { useAppCollection } from "@rootcx/sdk";
import { toast } from "@rootcx/ui";
import { IconArrowLeft } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Board, BOARD_GRADIENTS } from "@/types";

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
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 30);
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
    <div className="flex items-center gap-3 px-4 py-3 bg-black/20 backdrop-blur-sm border-b border-white/10 flex-shrink-0">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors px-2 py-1 rounded-lg hover:bg-white/10"
      >
        <IconArrowLeft className="h-4 w-4" />
        Boards
      </button>

      <div className="w-px h-5 bg-white/20" />

      {/* Board title — click to edit */}
      {editingTitle ? (
        <input
          ref={inputRef}
          className="text-white font-bold text-lg bg-white/20 rounded-lg px-3 py-1 outline-none focus:ring-2 ring-white/50 min-w-[200px]"
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveTitle();
            if (e.key === "Escape") {
              setTitleValue(board.title);
              setEditingTitle(false);
            }
          }}
        />
      ) : (
        <button
          onClick={() => setEditingTitle(true)}
          className="text-white font-bold text-lg hover:bg-white/10 px-3 py-1 rounded-lg transition-colors"
          title="Click to rename board"
        >
          {board.title}
        </button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Keyboard shortcuts hint */}
      <div className="hidden lg:flex items-center gap-3 text-white/50 text-xs">
        <span>
          <kbd className="bg-white/10 px-1 py-0.5 rounded text-[10px]">Click</kbd>{" "}
          open card
        </span>
        <span>
          <kbd className="bg-white/10 px-1 py-0.5 rounded text-[10px]">Drag</kbd>{" "}
          move
        </span>
        <span>
          <kbd className="bg-white/10 px-1 py-0.5 rounded text-[10px]">Esc</kbd>{" "}
          close
        </span>
        <span>
          <kbd className="bg-white/10 px-1 py-0.5 rounded text-[10px]">
            2× click
          </kbd>{" "}
          rename list
        </span>
        <span>
          <kbd className="bg-white/10 px-1 py-0.5 rounded text-[10px]">Enter</kbd>{" "}
          add card
        </span>
      </div>
    </div>
  );
}
