import { Middleware } from "../types";

const RELOAD_SCRIPT = `(function () {
  'use strict';
  var es = new EventSource('/__work__/events');
  es.addEventListener('browser', function (evt) {
    var msg = JSON.parse(evt.data);
    if (msg.code === 'rollup.BUNDLE_END') window.location.reload();
  });
  es.addEventListener('server', function (evt) {
    var msg = JSON.parse(evt.data);
    if (msg.code === 'rollup.BUNDLE_END') window.location.reload();
  });
}());`;

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

  const middleware: Middleware = (req, res, next) => {
    if (req.url === "/__work__/reload.js") {
      res.end(RELOAD_SCRIPT);
      return;
    } else if (req.url === "/__work__/events") {
      addSocket(res);
      req.on("close", () => removeSocket(res));
      return;
    } else {
      return next();
    }
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

  return { middleware, send };
}
