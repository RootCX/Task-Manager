serve({
  rpc: {
    ping: () => ({ pong: true }),
    echo: (params: any) => params,
    whoami: (_: any, caller: any) => caller,
  },
});
