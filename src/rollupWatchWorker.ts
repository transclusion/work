import path from "path";
import * as rollup from "rollup";
import { findConfig, findEnvConfig, findPlugins } from "./helpers";
import { workerData, parentPort } from "worker_threads";
import { getBrowserConfig } from "./rollup/browser";
import { getServerConfig } from "./rollup/server";

const cwd: string = workerData.cwd;
const target: string = workerData.target;

if (!cwd) throw new Error("Missing `cwd` in worker");
if (!target) throw new Error("Missing `cwd` in worker");
if (!parentPort) throw new Error("Missing `parentPort`");

const _parentPort = parentPort;
const config = findConfig(cwd);
const plugins = findPlugins(cwd, config);
const envConfig = findEnvConfig(cwd);
const pkg = require(path.resolve(cwd, "package.json"));

function cloneEvent(event: any) {
  if (event.code === "BUNDLE_END") {
    return {
      code: "BUNDLE_END",
      input: event.input,
      output: event.output
    };
  }
  if (event.code === "ERROR") {
    return {
      code: "ERROR",
      error: { message: event.error.message, stack: event.error.stack }
    };
  }
  if (event.code === "FATAL") {
    return {
      code: "FATAL",
      error: { message: event.error.message, stack: event.error.stack }
    };
  }
  return { code: event.code };
}

if (target === "browser") {
  const rollupConfig = getBrowserConfig({ config, envConfig, cwd, pkg, plugins });
  const watcher = rollup.watch(rollupConfig as any);
  watcher.on("event", event => {
    _parentPort.postMessage(cloneEvent(event));
  });
} else if (target === "server") {
  const rollupConfig = getServerConfig({ config, envConfig, cwd, pkg, plugins });
  const watcher = rollup.watch(rollupConfig as any);
  watcher.on("event", event => {
    _parentPort.postMessage(cloneEvent(event));
  });
} else {
  throw new Error(`unexpected target name: ${target}`);
}
