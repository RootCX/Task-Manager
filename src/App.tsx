import { useState } from "react";
import { AuthGate } from "@rootcx/sdk";
import { Button, Toaster } from "@rootcx/ui";
import { IconLayoutKanban, IconLogout } from "@tabler/icons-react";
import { Board } from "@/types";
import BoardsView from "@/components/BoardsView";
import KanbanBoard from "@/components/KanbanBoard";
import BoardHeader from "@/components/BoardHeader";

export default function App() {
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);

  return (
    <AuthGate appTitle="Kanban Task Manager">
      {({ user, logout }) => (
        <div className="h-screen flex flex-col overflow-hidden bg-background">
          {/* Top nav — always visible */}
          <header className="flex items-center gap-3 px-4 h-12 border-b border-border bg-card flex-shrink-0">
            <div className="flex items-center gap-2">
              <IconLayoutKanban className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm text-foreground">Kanban</span>
            </div>

            {selectedBoard && (
              <>
                <span className="text-border">/</span>
                <BoardHeader
                  board={selectedBoard}
                  onBack={() => setSelectedBoard(null)}
                  onBoardUpdated={setSelectedBoard}
                />
              </>
            )}

            <div className="flex-1" />

            <span className="text-sm text-muted-foreground hidden sm:block">
              {user.email}
            </span>
            <Button variant="ghost" size="icon" onClick={() => logout()} title="Sign out">
              <IconLogout className="h-4 w-4" />
            </Button>
          </header>

          {/* Main content */}
          <div className="flex-1 overflow-hidden">
            {selectedBoard ? (
              <KanbanBoard board={selectedBoard} />
            ) : (
              <div className="h-full overflow-y-auto">
                <BoardsView onSelectBoard={setSelectedBoard} />
              </div>
            )}
          </div>

          <Toaster />
        </div>
      )}
    </AuthGate>
  );
}
