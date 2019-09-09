import micro from "micro";
import mimeTypes from "mime-types";
import path from "path";
import { findConfig, matchRoute, matchStaticFile, readFile } from "./helpers";
import { Logger } from "./types";

interface Opts {
  cwd: string;
  logger: Logger;
  port?: string | number;
}

async function start(opts: Opts) {
  return new Promise(resolve => {
    const { cwd, logger } = opts;
    const config = findConfig(cwd);
    const port = opts.port || 3000;

    async function handler(req: any, res: any) {
      try {
        // log request
        logger.info(req.method, req.url);

        const staticFile = await matchStaticFile(cwd, config, req.url);

        if (staticFile) {
          const mimeType = mimeTypes.lookup(staticFile);
          const buf = await readFile(staticFile);
          res.writeHead(200, { "Content-Type": mimeType || "text/plain" });
          res.end(buf);
          return;
        }

        if (!config.server) {
          res.writeHead(404, { "Content-Type": "text/html" });
          res.end(`Not found: ${req.url}`);
          return;
        }

        const route = matchRoute(config.server.routes, req.url);

        if (!route) {
          res.writeHead(404, { "Content-Type": "text/html" });
          res.end(`Not found: ${req.url}`);
          return;
        }

        let serverPath = path.resolve(cwd, "dist/server", route.path);

        if (serverPath.endsWith(".ts"))
          serverPath = `${serverPath.substr(0, serverPath.length - 3)}.js`;
        if (serverPath.endsWith(".tsx"))
          serverPath = `${serverPath.substr(0, serverPath.length - 4)}.js`;

        require(serverPath)(req, res);
      } catch (err) {
        res.end(err.stack);
      }
    }

    const server = micro(handler);

    server.listen(Number(port), () => {
      logger.info(`Listening at http://localhost:${port}`);
      resolve();
    });
  });
}

export default start;
