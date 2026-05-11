import { useState, useEffect } from "react";
import { useRuntimeClient } from "@rootcx/sdk";
import type { PublicShareListing } from "@rootcx/sdk";
import { Button, toast } from "@rootcx/ui";
import { IconCopy, IconLink, IconLock, IconWorld, IconX } from "@tabler/icons-react";

const APP_ID = "task_manager";

interface Props {
  boardId: string;
  onClose: () => void;
}

/**
 * Share dialog for a board.
 *
 * Two states:
 * 1. No active share → show "Make public" button. On click, calls
 *    createPublicShare and displays the URL with token.
 * 2. Active share → show URL with copy button and a Revoke action. The raw
 *    token is only available right after creation; if the modal is
 *    re-opened on an existing share, only the prefix is shown and the
 *    "copy URL" button is disabled (force revoke+recreate to mint a new
 *    token).
 */
export default function ShareModal({ boardId, onClose }: Props) {
  const client = useRuntimeClient();
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<PublicShareListing | null>(null);
  const [freshUrl, setFreshUrl] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => { refresh(); }, []);

  async function refresh() {
    setLoading(true);
    try {
      const all = await client.listPublicShares(APP_ID);
      const match = all.find(s => (s.context as { board_id?: string })?.board_id === boardId);
      setActive(match ?? null);
    } catch (e) {
      toast.error(`Failed to load share status: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  async function enable() {
    setWorking(true);
    try {
      const share = await client.createPublicShare(APP_ID, { context: { board_id: boardId } });
      setFreshUrl(share.url);
      await navigator.clipboard.writeText(share.url);
      toast.success("Public link created and copied");
      await refresh();
    } catch (e) {
      toast.error(`Failed to create share: ${(e as Error).message}`);
    } finally {
      setWorking(false);
    }
  }

  async function revoke() {
    if (!active) return;
    setWorking(true);
    try {
      await client.revokePublicShare(APP_ID, active.id);
      toast.success("Public link revoked");
      setActive(null);
      setFreshUrl(null);
    } catch (e) {
      toast.error(`Failed to revoke: ${(e as Error).message}`);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Share board</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <IconX className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : active ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 text-sm">
              <IconWorld className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Public link active</div>
                <div className="text-muted-foreground text-xs">
                  Anyone with the link can view this board. Created {new Date(active.createdAt).toLocaleDateString()}.
                  {active.accessCount > 0 && <> Viewed {active.accessCount} time{active.accessCount === 1 ? "" : "s"}.</>}
                </div>
              </div>
            </div>

            {freshUrl ? (
              <div className="flex items-center gap-2 bg-muted rounded px-3 py-2">
                <IconLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <code className="text-xs truncate flex-1">{freshUrl}</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(freshUrl); toast.success("Copied"); }}
                  title="Copy URL"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <IconCopy className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="bg-muted rounded px-3 py-2 text-xs text-muted-foreground">
                The link token is no longer visible. Revoke and recreate to get a fresh URL.
              </div>
            )}

            <Button variant="outline" onClick={revoke} disabled={working} className="w-full">
              <IconLock className="h-4 w-4 mr-2" />
              Revoke public link
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-2 text-sm">
              <IconLock className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">This board is private</div>
                <div className="text-muted-foreground text-xs">
                  Make it public to get a read-only link anyone can open without signing in. Revocable at any time.
                </div>
              </div>
            </div>
            <Button onClick={enable} disabled={working} className="w-full">
              <IconWorld className="h-4 w-4 mr-2" />
              Make public
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
