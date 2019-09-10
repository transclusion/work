import micro from "micro";
import path from "path";
import { appHandler } from "../app";
import { findConfig } from "../helpers";
import { Logger } from "../types";
import { eventSource } from "./eventSource";
import { initWatchWorkers } from "./helpers";

interface Opts {
  cwd?: string;
  logger?: Logger;
  port?: string | number | undefined;
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
  const port = opts.port || 3000;

  const listen = (cb?: ListenCallback) => {
    const es = eventSource();
    const workers = initWatchWorkers(cwd, config.builds);

    workers.forEach(({ config, worker }) => {
      worker.on("error", event => {
        console.log(`TODO: ${config.target} worker:`, event);
      });
      worker.on("message", event => {
        if (event.code === "rollup.BUNDLE_END") {
          logger.info("Built", path.relative(cwd, event.input));
          if (config.target === "server") {
            event.output.forEach((distPrefix: string) => {
              Object.keys(require.cache).forEach(filePath => {
                if (filePath.startsWith(distPrefix)) {
                  delete require.cache[filePath];
                }
              });
            });
          }
        } else if (event.code === "rollup.ERROR") {
          logger.error(event.error.stack);
          process.exit(1);
        } else if (event.code === "rollup.FATAL") {
          logger.error(event.error.stack);
          process.exit(1);
        }
        es.send(config.target, event);
      });
    });

    async function handler(req: any, res: any) {
      try {
        await es.middleware(req, res, async () => {
          logger.info(req.method, req.url);
          await appHandler(cwd, config, req, res);
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
        workers.forEach(({ worker }) => {
          worker.terminate();
        });
      });
    }
  };

  return { listen };
}

export default dev;
