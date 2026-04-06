import { useState, useRef, useEffect } from "react";
import { useAppCollection } from "@rootcx/sdk";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Label, Textarea, toast } from "@rootcx/ui";
import { IconPlus, IconTrash, IconEdit, IconLayoutKanban, IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Board, BOARD_GRADIENTS } from "@/types";

const APP_ID = "task_manager";

interface Props {
  onSelectBoard: (board: Board) => void;
}

export default function BoardsView({ onSelectBoard }: Props) {
  const { data: boards, loading, create, update, remove } = useAppCollection<Board>(APP_ID, "board");

  const [showCreate, setShowCreate] = useState(false);
  const [editBoard, setEditBoard] = useState<Board | null>(null);
  const [deleteBoard, setDeleteBoard] = useState<Board | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formColor, setFormColor] = useState(BOARD_GRADIENTS[0]);

  const titleRef = useRef<HTMLInputElement>(null);
  const sorted = [...boards].sort((a, b) => a.position - b.position);
  const isEditing = !!editBoard;

  useEffect(() => {
    if (showCreate || editBoard) setTimeout(() => titleRef.current?.focus(), 50);
  }, [showCreate, editBoard]);

  function openCreate() {
    setFormTitle(""); setFormDesc(""); setFormColor(BOARD_GRADIENTS[0]); setShowCreate(true);
  }

  function openEdit(e: React.MouseEvent, board: Board) {
    e.stopPropagation();
    setFormTitle(board.title); setFormDesc(board.description || ""); setFormColor(board.color || BOARD_GRADIENTS[0]);
    setEditBoard(board);
  }

  function closeForm() { setShowCreate(false); setEditBoard(null); }

  async function handleSubmit() {
    if (!formTitle.trim()) return;
    const fields = { title: formTitle.trim(), description: formDesc.trim() || undefined, color: formColor };
    try {
      if (isEditing) {
        await update(editBoard!.id, fields);
        toast.success("Board updated");
      } else {
        await create({ ...fields, position: (sorted.at(-1)?.position ?? 0) + 65536 });
        toast.success("Board created");
      }
      closeForm();
    } catch {
      toast.error(isEditing ? "Failed to update board" : "Failed to create board");
    }
  }

  async function handleDelete() {
    if (!deleteBoard) return;
    try {
      await remove(deleteBoard.id);
      toast.success("Board deleted");
      setDeleteBoard(null);
    } catch {
      toast.error("Failed to delete board");
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <IconLayoutKanban className="h-5 w-5 text-primary" />Your Boards
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your onboarding workflows</p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <IconPlus className="h-4 w-4" />New Board
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {sorted.map((board) => (
          <div key={board.id} onClick={() => onSelectBoard(board)}
            className="relative group cursor-pointer rounded-lg overflow-hidden aspect-video flex flex-col justify-between p-3 border border-border hover:border-primary/50 hover:shadow-md transition-all duration-150"
          >
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-80", board.color || BOARD_GRADIENTS[0])} />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
            <div className="relative flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={(e) => openEdit(e, board)} className="p-1 rounded bg-black/30 hover:bg-black/50 text-white transition-colors">
                <IconEdit className="h-3 w-3" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setDeleteBoard(board); }} className="p-1 rounded bg-black/30 hover:bg-destructive text-white transition-colors">
                <IconTrash className="h-3 w-3" />
              </button>
            </div>
            <div className="relative">
              <p className="text-white font-semibold text-sm leading-tight drop-shadow-sm">{board.title}</p>
              {board.description && <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{board.description}</p>}
            </div>
          </div>
        ))}
        <button onClick={openCreate} className="aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-muted/50 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-primary transition-all">
          <IconPlus className="h-6 w-6" />
          <span className="text-xs font-medium">Create board</span>
        </button>
      </div>

      {/* Create / Edit */}
      <Dialog open={showCreate || isEditing} onOpenChange={(o) => !o && closeForm()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Board" : "Create Board"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className={cn("h-20 rounded-md bg-gradient-to-br flex items-end p-3", formColor)}>
              <span className="text-white font-medium text-sm drop-shadow-sm">{formTitle || "Board name"}</span>
            </div>
            <div className="space-y-1.5">
              <Label>Board Title</Label>
              <Input ref={titleRef} value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. Client Onboarding Q1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                  if (e.key === "Escape") closeForm();
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Optional description…" rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {BOARD_GRADIENTS.map((g) => (
                  <button key={g} onClick={() => setFormColor(g)}
                    className={cn("w-7 h-7 rounded bg-gradient-to-br transition-all", g, formColor === g ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105 opacity-70 hover:opacity-100")}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button className="flex-1" disabled={!formTitle.trim()} onClick={handleSubmit}>
                {isEditing ? "Save Changes" : "Create Board"}
              </Button>
              <Button variant="outline" size="icon" onClick={closeForm}><IconX className="h-4 w-4" /></Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteBoard} onOpenChange={(o) => !o && setDeleteBoard(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Delete Board?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">
            This will permanently delete <strong>"{deleteBoard?.title}"</strong> and all its lists and cards. This action cannot be undone.
          </p>
          <div className="flex gap-2 mt-4">
            <Button variant="destructive" className="flex-1" onClick={handleDelete}>Delete Board</Button>
            <Button variant="outline" onClick={() => setDeleteBoard(null)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
