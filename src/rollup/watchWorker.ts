import path from "path";
import * as rollup from "rollup";
import { workerData, parentPort } from "worker_threads";
import { findConfig, findEnvConfig, findPlugins, noopPluginFn } from "../helpers";
import { buildRollupConfig } from "./config";

const cwd: string = workerData.cwd;
const buildConfigIdx: number = workerData.buildConfigIdx;

if (!cwd) throw new Error("Missing `cwd` in workerData");
if (!parentPort) throw new Error("Missing `parentPort`");

const _parentPort = parentPort;
const config = findConfig(cwd);
if (!config.builds) throw new Error("No configured builds");
const buildConfig = config.builds[buildConfigIdx];
const plugins = findPlugins(cwd, config.plugins || []);
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

const rollupConfig = buildRollupConfig({
  buildConfig,
  envConfig,
  cwd,
  pkg,
  pluginFn: config.extendRollup || noopPluginFn,
  plugins
});

const watcher = rollup.watch(rollupConfig as any);

watcher.on("event", event => {
  _parentPort.postMessage(cloneEvent(event));
});
