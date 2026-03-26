import { useState } from "react";
import { AuthGate } from "@rootcx/sdk";
import { Toaster } from "@rootcx/ui";
import { cn } from "@/lib/utils";
import { Board, BOARD_GRADIENTS } from "@/types";
import BoardsView from "@/components/BoardsView";
import KanbanBoard from "@/components/KanbanBoard";
import BoardHeader from "@/components/BoardHeader";

export default function App() {
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);

  return (
    <AuthGate appTitle="Kanban Task Manager">
      {({ user, logout }) => (
        <div
          className={cn(
            "h-screen flex flex-col overflow-hidden",
            selectedBoard
              ? cn(
                  "bg-gradient-to-br",
                  selectedBoard.color || BOARD_GRADIENTS[0]
                )
              : "bg-background"
          )}
        >
          {selectedBoard ? (
            /* Board view */
            <>
              <BoardHeader
                board={selectedBoard}
                onBack={() => setSelectedBoard(null)}
                onBoardUpdated={setSelectedBoard}
              />
              <KanbanBoard board={selectedBoard} />
            </>
          ) : (
            /* Boards home */
            <div className="flex flex-col h-full">
              {/* Top nav */}
              <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-background/95 backdrop-blur-sm flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                    <svg className="h-4 w-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                  </div>
                  <span className="font-bold text-foreground">Kanban</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-7 h-7 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                      {user.email[0].toUpperCase()}
                    </div>
                    <span className="hidden sm:block">{user.email}</span>
                  </div>
                  <button
                    onClick={() => logout()}
                    className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </header>

              {/* Boards list */}
              <div className="flex-1 overflow-y-auto">
                <BoardsView onSelectBoard={setSelectedBoard} />
              </div>
            </div>
          )}

          <Toaster />
        </div>
      )}
    </AuthGate>
  );
}
