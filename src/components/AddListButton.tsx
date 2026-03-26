import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { IconPlus, IconX } from "@tabler/icons-react";

interface Props {
  onCreate: (title: string) => void;
}

export default function AddListButton({ onCreate }: Props) {
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) setTimeout(() => inputRef.current?.focus(), 30);
  }, [adding]);

  function handleCreate() {
    if (!value.trim()) {
      setAdding(false);
      return;
    }
    onCreate(value.trim());
    setValue("");
    // Keep open for quick multi-list creation
    setTimeout(() => inputRef.current?.focus(), 30);
  }

  if (adding) {
    return (
      <div className="w-72 flex-shrink-0">
        <div className="rounded-2xl bg-muted/60 backdrop-blur-sm border border-border/50 p-2 space-y-2">
          <input
            ref={inputRef}
            className="w-full text-sm bg-card rounded-xl px-3 py-2 outline-none focus:ring-2 ring-primary shadow-sm border border-border"
            placeholder="List title…"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") {
                setValue("");
                setAdding(false);
              }
            }}
          />
          <div className="flex gap-1.5">
            <button
              onClick={handleCreate}
              disabled={!value.trim()}
              className="flex-1 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add list
            </button>
            <button
              onClick={() => {
                setValue("");
                setAdding(false);
              }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setAdding(true)}
      className={cn(
        "w-72 flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-2xl",
        "bg-white/10 hover:bg-white/20 text-white/80 hover:text-white",
        "border border-white/20 hover:border-white/40",
        "transition-all duration-150 group backdrop-blur-sm"
      )}
    >
      <IconPlus className="h-5 w-5 group-hover:scale-110 transition-transform" />
      <span className="text-sm font-medium">Add another list</span>
    </button>
  );
}
