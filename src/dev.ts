import fs from "fs";
import micro from "micro";
import mimeTypes from "mime-types";
import path from "path";
import pathToRegexp from "path-to-regexp";
import * as rollup from "rollup";
import { getClientConfig } from "./rollup/client";
import { getServerConfig } from "./rollup/server";
import { eventSource } from "./eventSource";
import { findConfig } from "./helpers";
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
  const envConfig = {};
  const pkg = {};

  const rollupConfig = {
    client: getClientConfig({ config, envConfig, cwd, pkg }),
    server: getServerConfig({ config, envConfig, cwd, pkg })
  };

  const port = (config.server && config.server.port) || 3000;

  const listen = (cb?: ListenCallback) => {
    const es = eventSource();

    const watchers = {
      client: rollup.watch(rollupConfig.client as any),
      server: rollup.watch(rollupConfig.server as any)
    };

    function matchRoute(routes: any, url: string): { path: string } | null {
      let match = null;
      Object.keys(routes).some(routePattern => {
        const keys: any[] = [];
        const regexp = pathToRegexp(routePattern, keys);
        const result = regexp.exec(url);
        if (result) {
          match = {
            path: routes[routePattern],
            params: keys.reduce((curr, x, i) => {
              curr[typeof x.name === "number" ? `$${x.name}` : x.name] = result[i + 1];
              return curr;
            }, {})
          };
          return true;
        }
        return false;
      });
      return match;
    }

    function matchStaticFile(url: string): Promise<string | null> {
      return new Promise(resolve => {
        if (url === "/") return resolve(null);
        const filePath = path.resolve(cwd, "dist/client", `.${url}`);
        fs.access(filePath, (fs as any).F_OK, err => {
          if (err) resolve(null);
          else resolve(filePath);
        });
      });
    }

    function readFile(filePath: string) {
      return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, buf) => {
          if (err) reject(err);
          else resolve(buf);
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

    watchers.client.on("event", event => {
      if (event.code === "FATAL") {
        logger.error(event.error.stack);
        process.exit(1);
      }
      es.send("client", event);
    });

    watchers.server.on("event", event => {
      if (event.code === "BUNDLE_END") {
        event.output.forEach((distPrefix: string) => {
          Object.keys(require.cache).forEach(filePath => {
            if (filePath.startsWith(distPrefix)) {
              delete require.cache[filePath];
            }
          });
        });
      } else if (event.code === "FATAL") {
        logger.error(event.error.stack);
        process.exit(1);
      }
      es.send("server", event);
    });

    server.listen(port, () => {
      logger.info(`Listening at http://localhost:${port}`);
    });

    if (cb) {
      cb(function close() {
        server.close();
        watchers.client.close();
        watchers.server.close();
      });
    }
  };

  return { listen };
}

export default dev;
