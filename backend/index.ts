// Task_manager backend worker.
//
// `serve()` and the `ctx` object are injected by the RootCX runtime prelude
// (see core/src/backend_prelude.js). `ctx.collection(name)` exposes
// `insert/update/find/findOne` against the per-app schema.
//
// Public RPCs are declared in manifest.json under `public.rpcs`. For
// `get_public_board`, the core enforces that the caller's share-token
// `context.board_id` matches the request `params.board_id` BEFORE this
// handler runs — so no scope-check is needed here.

declare const serve: (cfg: {
  rpc: Record<string, (params: any, caller: any, ctx: any) => unknown | Promise<unknown>>;
}) => void;

interface BoardRow { id: string; title: string; description: string | null; color: string | null; }
interface ListRow { id: string; title: string; board_id: string; position: number; color: string | null; }
interface CardRow {
  id: string; title: string; description: string | null;
  list_id: string; board_id: string; position: number;
  labels: string[] | null; priority: string | null; due_date: string | null;
  cover_color: string | null; archived: boolean | null;
}
interface CommentRow { id: string; card_id: string; content: string; author_name: string; }

serve({
  rpc: {
    ping: () => ({ pong: true }),
    echo: (params: any) => params,
    whoami: (_: any, caller: any) => caller,

    /**
     * Returns the board + all its lists/cards/comments in one shot.
     *
     * Authorization: this RPC is declared `public` in manifest.json with
     * `scope: ["board_id"]`. The core verifies the request's `board_id`
     * matches the share-token context BEFORE dispatching, so no additional
     * check is required here.
     */
    get_public_board: async (params: { board_id: string }, _caller: unknown, ctx: any) => {
      const boardId = params?.board_id;
      if (!boardId) throw new Error("board_id required");

      const board: BoardRow | null = await ctx.collection("board").findOne({ id: boardId });
      if (!board) throw new Error("board not found");

      const lists: ListRow[] = await ctx.collection("list").find({ board_id: boardId });
      const cards: CardRow[] = await ctx.collection("card").find({ board_id: boardId });

      const commentArrays: CommentRow[][] = await Promise.all(
        cards.map((card: CardRow) => ctx.collection("card_comment").find({ card_id: card.id }))
      );
      const allComments: CommentRow[] = commentArrays.flat();

      lists.sort((a, b) => a.position - b.position);
      cards.sort((a, b) => a.position - b.position);

      return {
        board: {
          id: board.id,
          title: board.title,
          description: board.description,
          color: board.color,
        },
        lists,
        cards,
        comments: allComments,
      };
    },
  },
});
