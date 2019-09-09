import fs from "fs";
import micro from "micro";
import mimeTypes from "mime-types";
import path from "path";
import { Worker } from "worker_threads";
import { eventSource } from "./eventSource";
import { findConfig, matchRoute, readFile } from "./helpers";
import { reloadScript } from "./reload";
import { Logger } from "./types";

interface Opts {
  cwd?: string;
  logger?: Logger;
}

const DEFAULT_LOGGER: Logger = {
  error(...args) {
    console.error("[work]", ...args);
  },
  info(...args) {
    console.log("[work]", ...args);
  }
};

type ListenCallback = ((handleListen: any) => void) | (() => void);

function dev(opts: Opts) {
  if (!opts.cwd) throw new Error("`cwd` is missing in options");

  const logger = opts.logger || DEFAULT_LOGGER;
  const cwd = opts.cwd;
  const config = findConfig(cwd);
  const port = (config.server && config.server.port) || 3000;

  const listen = (cb?: ListenCallback) => {
    const es = eventSource();

    const workers = {
      browser: new Worker(path.resolve(__dirname, "./rollupWatchWorker.js"), {
        env: {
          BABEL_ENV: "browser",
          NODE_ENV: process.env.NODE_ENV
        },
        workerData: {
          cwd,
          target: "browser"
        }
      } as any),
      server: new Worker(path.resolve(__dirname, "./rollupWatchWorker.js"), {
        env: {
          BABEL_ENV: "server",
          NODE_ENV: process.env.NODE_ENV
        },
        workerData: {
          cwd,
          target: "server"
        }
      } as any)
    };

    workers.browser.on("error", event => {
      console.log("TODO: workers.browser.error", event);
    });

    workers.browser.on("message", event => {
      console.log(event);
      if (event.code === "ERROR") {
        logger.error(event.error.stack);
        process.exit(1);
      } else if (event.code === "FATAL") {
        logger.error(event.error.stack);
        process.exit(1);
      }
      es.send("browser", event);
    });

    workers.server.on("error", event => {
      console.log("TODO: workers.server.error", event);
    });

    workers.server.on("message", event => {
      console.log(event);
      if (event.code === "BUNDLE_END") {
        event.output.forEach((distPrefix: string) => {
          Object.keys(require.cache).forEach(filePath => {
            if (filePath.startsWith(distPrefix)) {
              delete require.cache[filePath];
            }
          });
        });
      } else if (event.code === "ERROR") {
        logger.error(event.error.stack);
        process.exit(1);
      } else if (event.code === "FATAL") {
        logger.error(event.error.stack);
        process.exit(1);
      }
      es.send("server", event);
    });

    function matchStaticFile(url: string): Promise<string | null> {
      return new Promise(resolve => {
        if (url === "/") return resolve(null);
        const filePath = path.resolve(cwd, "dist/browser", `.${url}`);
        fs.access(filePath, (fs as any).F_OK, err => {
          if (err) resolve(null);
          else resolve(filePath);
        });
      });
    }

    async function handler(req: any, res: any) {
      try {
        if (req.url === "/__work__/reload.js") {
          res.end(reloadScript());
          return;
        }

        if (req.url === "/__work__/events") {
          es.addSocket(res);
          req.on("close", () => es.removeSocket(res));
          return;
        }

        // log request
        logger.info(req.method, req.url);

        const staticFile = await matchStaticFile(req.url);

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

        require(serverPath)(req, {
          end(body: string) {
            return res.end(
              body.replace("</body>", '<script src="/__work__/reload.js"></script></body>')
            );
          },
          __proto__: res
        });
      } catch (err) {
        res.end(err.stack);
      }
    }

    const server = micro(handler);

    server.listen(port, () => {
      logger.info(`Listening at http://localhost:${port}`);
    });

    if (cb) {
      cb(function close() {
        server.close();
        workers.browser.terminate();
        workers.server.terminate();
      });
    }
  };

  return { listen };
}

export default dev;
