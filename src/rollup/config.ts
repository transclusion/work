import path from "path";
import { RollupOptions } from "rollup";
import alias from "rollup-plugin-alias";
import babel from "rollup-plugin-babel";
import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";
import json from "rollup-plugin-json";
import replace from "rollup-plugin-replace";
import { terser } from "rollup-plugin-terser";
import { noopPluginFn } from "../helpers";
import { BuildConfig, Config, PluginFn } from "../types";
import { applyRollupPlugins } from "./helpers";
import { RollupOpts } from "./types";

interface Opts {
  buildConfig: BuildConfig;
  cwd: string;
  envConfig: { [key: string]: string };
  minify?: boolean;
  pkg: {
    alias?: { [key: string]: string };
  };
  pluginFn: PluginFn;
  plugins: Config[];
}

export function buildRollupConfig(opts: Opts): RollupOptions {
  const extensions = [".ts", ".tsx", ".es6", ".es", ".jsx", ".js", ".mjs"];
  const { cwd, buildConfig, envConfig, minify, pkg, pluginFn, plugins } = opts;
  const dirPath = path.resolve(cwd, buildConfig.dir);
  const aliasConfig = pkg.alias || {};
  const rollupOpts: RollupOpts = applyRollupPlugins(
    {
      alias: {
        entries: Object.keys(aliasConfig).map(find => ({
          find,
          replacement: path.resolve(cwd, aliasConfig[find])
        }))
      },
      babel: {
        root: cwd,
        exclude: "node_modules/**",
        extensions
      },
      external: buildConfig.target === "server" ? ["micro"] : [],
      resolve: {
        extensions,
        mainFields:
          buildConfig.target === "browser" ? ["browser", "module", "main"] : ["module", "main"]
      },
      commonjs: {
        sourceMap: true
      },
      replace: {
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
        ...Object.keys(envConfig).reduce(
          (curr, k) => {
            curr[`process.env.${k}`] = envConfig[k];
            return curr;
          },
          {} as any
        )
      },
      terser: {}
    },
    buildConfig,
    [pluginFn].concat(plugins.map(p => p.extendRollup || noopPluginFn))
  );

  return {
    input: path.resolve(cwd, buildConfig.src),
    output: {
      dir: dirPath,
      format: buildConfig.target === "server" ? "cjs" : "iife",
      sourcemap: true
    },
    external: rollupOpts.external,
    plugins: [
      babel(rollupOpts.babel),
      alias(rollupOpts.alias),
      json(),
      resolve(rollupOpts.resolve),
      replace(rollupOpts.replace),
      commonjs(rollupOpts.commonjs),
      minify && terser()
    ].filter(Boolean)
  };
}
