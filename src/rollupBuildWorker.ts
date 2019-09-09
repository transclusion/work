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

async function rollupBuild(rollupConfig: any) {
  const { output: outputOptions, ...inputOptions } = rollupConfig;
  const bundle = await rollup.rollup(inputOptions);
  return bundle.write(outputOptions);
}

if (target === "browser") {
  const rollupConfig = getBrowserConfig({ config, envConfig, cwd, pkg, plugins, minify: true });

  Promise.all(rollupConfig.map(rollupBuild))
    .then(() => {
      _parentPort.postMessage({ type: "complete" });
    })
    .catch(err => {
      _parentPort.postMessage({ error: "error", message: err.message, stack: err.stack });
    });
} else if (target === "server") {
  const rollupConfig = getServerConfig({ config, envConfig, cwd, pkg, plugins });

  Promise.all(rollupConfig.map(rollupBuild))
    .then(() => {
      _parentPort.postMessage({ type: "complete" });
    })
    .catch(err => {
      _parentPort.postMessage({ error: "error", message: err.message, stack: err.stack });
    });
} else {
  throw new Error(`unexpected target name: ${target}`);
}
