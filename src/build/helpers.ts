import path from "path";
import { Worker } from "worker_threads";

export function initWorker(cwd: string, buildConfigIdx: number, target: string) {
  return new Worker(path.resolve(__dirname, "./worker.js"), {
    env: {
      BABEL_ENV: target,
      NODE_ENV: process.env.NODE_ENV || "development"
    },
    workerData: {
      cwd,
      buildConfigIdx
    }
  } as any);
}
