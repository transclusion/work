import cpx from "cpx";
import path from "path";
import * as rollup from "rollup";
import { workerData, parentPort } from "worker_threads";
import { findConfig, findEnvConfig, findPlugins, noopPluginFn } from "../helpers";
import { buildRollupConfig } from "../rollup/config";

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
console.log(envConfig);
const pkg = require(path.resolve(cwd, "package.json"));

function cloneRollupEvent(event: any) {
  if (event.code === "BUNDLE_END") {
    return {
      code: "rollup.BUNDLE_END",
      input: event.input,
      output: event.output
    };
  }
  if (event.code === "ERROR") {
    return {
      code: "rollup.ERROR",
      error: { message: event.error.message, stack: event.error.stack }
    };
  }
  if (event.code === "FATAL") {
    return {
      code: "rollup.FATAL",
      error: { message: event.error.message, stack: event.error.stack }
    };
  }
  return { code: `rollup.${event.code}` };
}

if (["browser", "server"].indexOf(buildConfig.target) > -1) {
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
    _parentPort.postMessage(cloneRollupEvent(event));
  });
} else if (buildConfig.target === "static") {
  const watcher = cpx.watch(buildConfig.src, buildConfig.dir);
  watcher.on("copy", evt => {
    _parentPort.postMessage({ code: "cpx.copy", src: evt.srcPath, dest: evt.dstPath });
  });
  watcher.on("remove", evt => {
    _parentPort.postMessage({ code: "cpx.remove", path: evt.path });
  });
  watcher.on("watch-error", evt => {
    console.log("watch-error", evt);
    _parentPort.postMessage({ code: "cpx.watch-error" });
  });
} else {
  throw new Error(`Unknown target: ${buildConfig.target}`);
}
