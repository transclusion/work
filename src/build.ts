import path from "path";
import { Worker } from "worker_threads";
// import * as rollup from "rollup";
// import { findConfig, findEnvConfig, findPlugins } from "./helpers";
// import { getBrowserConfig } from "./rollup/browser";
// import { getServerConfig } from "./rollup/server";
import { Logger } from "./types";

interface Opts {
  cwd?: string;
  logger?: Logger;
}

function rollupBuild(cwd: string, target: "browser" | "server") {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.resolve(__dirname, "./rollupBuildWorker.js"), {
      env: {
        BABEL_ENV: target,
        NODE_ENV: process.env.NODE_ENV
      },
      workerData: { cwd, target }
    } as any);

    worker.on("message", event => {
      if (event.type === "complete") {
        resolve();
      }

      if (event.type === "error") {
        reject(new Error(event.message));
      }
    });
  });
}

async function build(opts: Opts) {
  if (!opts.cwd) throw new Error("Missing cwd");

  const cwd = opts.cwd;

  await rollupBuild(cwd, "browser");
  await rollupBuild(cwd, "server");

  // const config = findConfig(cwd);
  // const plugins = findPlugins(cwd, config);
  // const envConfig = findEnvConfig(cwd);
  // const pkg = require(path.resolve(cwd, "package.json"));

  // const rollupConfig: any = {
  //   client: getBrowserConfig({ config, envConfig, cwd, pkg, minify: true, plugins }),
  //   server: getServerConfig({ config, envConfig, cwd, pkg, minify: true, plugins })
  // };

  // await Promise.all([
  //   ...rollupConfig.client.map(rollupBuild),
  //   ...rollupConfig.server.map(rollupBuild)
  // ]);

  // const workers = {
  //   browser: ,
  //   server: new Worker(path.resolve(__dirname, "./rollupWatchWorker.js"), {
  //     env: {
  //       BABEL_ENV: "server",
  //       NODE_ENV: process.env.NODE_ENV
  //     },
  //     workerData: {
  //       cwd,
  //       target: "server"
  //     }
  //   } as any)
  // };

  // workers.browser.on("error", event => {
  //   console.log("TODO: workers.browser.error", event);
  // });

  // workers.browser.on("message", event => {
  //   if (event.code === "ERROR") {
  //     logger.error(event.error.stack);
  //     process.exit(1);
  //   } else if (event.code === "FATAL") {
  //     logger.error(event.error.stack);
  //     process.exit(1);
  //   }
  // });

  // workers.server.on("error", event => {
  //   console.log("TODO: workers.server.error", event);
  // });

  // workers.server.on("message", event => {
  //   if (event.code === "BUNDLE_END") {
  //     event.output.forEach((distPrefix: string) => {
  //       Object.keys(require.cache).forEach(filePath => {
  //         if (filePath.startsWith(distPrefix)) {
  //           delete require.cache[filePath];
  //         }
  //       });
  //     });
  //   } else if (event.code === "ERROR") {
  //     logger.error(event.error.stack);
  //     process.exit(1);
  //   } else if (event.code === "FATAL") {
  //     logger.error(event.error.stack);
  //     process.exit(1);
  //   }
  // });
}

export default build;
