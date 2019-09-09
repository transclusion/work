import path from "path";
import { Worker } from "worker_threads";
import { BuildConfig } from "../types";

export function initWatchWorkers(cwd: string, builds?: BuildConfig[]) {
  if (!builds) return [];
  return builds.map((buildConfig, buildConfigIdx) => {
    return {
      config: buildConfig,
      worker: new Worker(path.resolve(__dirname, "../rollup/watchWorker.js"), {
        env: {
          BABEL_ENV: buildConfig.target,
          NODE_ENV: process.env.NODE_ENV
        },
        workerData: {
          cwd,
          buildConfigIdx
        }
      } as any)
    };
  });
}
