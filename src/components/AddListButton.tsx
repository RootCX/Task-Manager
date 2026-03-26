import { useState, useRef, useEffect } from "react";
import { Button } from "@rootcx/ui";
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
    if (!value.trim()) { setAdding(false); return; }
    onCreate(value.trim());
    setValue("");
    setTimeout(() => inputRef.current?.focus(), 30);
  }

  if (adding) {
    return (
      <div className="w-64 flex-shrink-0">
        <div className="rounded-lg bg-muted border border-border p-2 space-y-1.5">
          <input
            ref={inputRef}
            className="w-full text-sm bg-background border border-border rounded px-2.5 py-1.5 outline-none focus:ring-1 ring-ring"
            placeholder="List title…"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") { setValue(""); setAdding(false); }
            }}
          />
          <div className="flex gap-1.5">
            <Button
              size="sm"
              className="flex-1 h-7 text-xs"
              disabled={!value.trim()}
              onClick={handleCreate}
            >
              Add list
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => { setValue(""); setAdding(false); }}
            >
              <IconX className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setAdding(true)}
      className="w-64 flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border bg-muted/50 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted transition-all text-sm"
    >
      <IconPlus className="h-4 w-4" />
      Add another list
    </button>
  );
}
