import path from "path";
import * as rollup from "rollup";
import { findConfig, findEnvConfig, findPlugins } from "./helpers";
import { getClientConfig } from "./rollup/client";
import { getServerConfig } from "./rollup/server";
import { Logger } from "./types";

interface Opts {
  cwd?: string;
  logger?: Logger;
}

async function rollupBuild(rollupConfig: any) {
  const { output: outputOptions, ...inputOptions } = rollupConfig;
  const bundle = await rollup.rollup(inputOptions);
  return bundle.write(outputOptions);
}

async function build(opts: Opts) {
  if (!opts.cwd) throw new Error("Missing cwd");

  const { cwd } = opts;
  const config = findConfig(cwd);
  const plugins = findPlugins(cwd, config);
  const envConfig = findEnvConfig(cwd);
  const pkg = require(path.resolve(cwd, "package.json"));

  const rollupConfig: any = {
    client: getClientConfig({ config, envConfig, cwd, pkg, minify: true, plugins }),
    server: getServerConfig({ config, envConfig, cwd, pkg, minify: true, plugins })
  };

  await Promise.all([
    ...rollupConfig.client.map(rollupBuild),
    ...rollupConfig.server.map(rollupBuild)
  ]);
}

export default build;
