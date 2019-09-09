import path from "path";
import { Worker } from "worker_threads";
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
}

export default build;
