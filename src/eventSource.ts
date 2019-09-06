export function eventSource() {
  const sockets: any[] = [];

  const addSocket = (socket: any) => {
    socket.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    });
    socket.write("\n");
    sockets.push(socket);
  };

  const removeSocket = (socket: any) => {
    const idx = sockets.indexOf(socket);
    if (idx > -1) sockets.splice(idx, 1);
  };

  const send = (type: string, msg: any) => {
    sockets.forEach(socket => {
      socket.write(`event: ${type}\n`);
      socket.write(`data: ${JSON.stringify(msg)}\n\n`);
    });
  };

  return { addSocket, removeSocket, send };
}
