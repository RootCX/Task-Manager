import { useState, useEffect } from "react";
import { AuthGate } from "@rootcx/sdk";
import { Button, Toaster } from "@rootcx/ui";
import { IconLayoutKanban, IconLogout } from "@tabler/icons-react";
import { Board } from "@/types";
import BoardsView from "@/components/BoardsView";
import KanbanBoard from "@/components/KanbanBoard";
import BoardHeader from "@/components/BoardHeader";
import PublicBoardView from "@/components/PublicBoardView";

/**
 * Detects `/share/:token` URLs. We don't pull in react-router for this since
 * the rest of the app uses in-memory routing — a single regex on
 * `window.location.pathname` is enough and keeps the public bundle as small
 * as possible (no router runtime, no auth context, no localStorage access).
 */
function useShareTokenFromPath(): string | null {
  const [token, setToken] = useState<string | null>(() => extractToken(window.location.pathname));
  useEffect(() => {
    const onChange = () => setToken(extractToken(window.location.pathname));
    window.addEventListener("popstate", onChange);
    return () => window.removeEventListener("popstate", onChange);
  }, []);
  return token;
}

function extractToken(pathname: string): string | null {
  // 43-char base64url token per /core/src/extensions/sharing/tokens.rs
  const m = pathname.match(/\/share\/([A-Za-z0-9_-]{43})\/?$/);
  return m ? m[1] : null;
}

export default function App() {
  const shareToken = useShareTokenFromPath();
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);

  // Public share view: bypasses AuthGate entirely. No login form, no
  // RuntimeProvider context — PublicBoardView constructs its own isolated
  // client with `persist: false`.
  if (shareToken) {
    return (
      <>
        <PublicBoardView token={shareToken} />
        <Toaster />
      </>
    );
  }

  return (
    <AuthGate appTitle="Kanban Task Manager">
      {({ user, logout }) => (
        <div className="h-screen flex flex-col overflow-hidden bg-background">
          <header className="flex items-center gap-3 px-4 h-12 border-b border-border bg-card flex-shrink-0">
            <div className="flex items-center gap-2">
              <IconLayoutKanban className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">Kanban</span>
            </div>
            {selectedBoard && (
              <BoardHeader board={selectedBoard} onBack={() => setSelectedBoard(null)} onBoardUpdated={setSelectedBoard} />
            )}
            <div className="flex-1" />
            <span className="text-sm text-muted-foreground hidden sm:block">{user.email}</span>
            <Button variant="ghost" size="icon" onClick={logout} title="Sign out">
              <IconLogout className="h-4 w-4" />
            </Button>
          </header>

          <div className="flex-1 overflow-hidden">
            {selectedBoard ? (
              <KanbanBoard board={selectedBoard} currentUserId={user.id} />
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
