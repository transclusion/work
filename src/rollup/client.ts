import path from "path";
import { RollupOptions } from "rollup";
import alias from "rollup-plugin-alias";
import babel from "rollup-plugin-babel";
import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";
import json from "rollup-plugin-json";
import replace from "rollup-plugin-replace";
import { terser } from "rollup-plugin-terser";
import { RollupOpts } from "../types";
import { extendRollupOpts, defaultExtendRollupOpts } from "./helpers";
import { Opts } from "./types";

export function getClientConfig(opts: Opts): RollupOptions[] {
  const { config, envConfig, cwd, minify, pkg, plugins } = opts;
  const clientConfig = config.client;

  if (!clientConfig || !clientConfig.input) return [];

  const rootPath = path.resolve(cwd, clientConfig.context || ".");
  const aliasConfig = pkg.alias || {};
  const rollupOpts: RollupOpts = extendRollupOpts(
    {
      alias: {
        entries: Object.keys(aliasConfig).map(find => ({
          find,
          replacement: path.resolve(cwd, aliasConfig[find])
        }))
      },
      babel: {
        babelrc: false,
        exclude: "node_modules/**",
        extensions: [".ts", ".tsx", ".es6", ".es", ".jsx", ".js", ".mjs"],
        presets: [
          require.resolve("@babel/preset-typescript"),
          require.resolve("@babel/preset-env"),
          require.resolve("@babel/preset-react")
        ]
      },
      external: [],
      resolve: {
        extensions: [".ts", ".tsx", ".es6", ".es", ".jsx", ".js", ".mjs"],
        mainFields: ["browser", "module", "main"]
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
    [config.extendRollup || defaultExtendRollupOpts].concat(
      plugins.map(p => p.extendRollup || defaultExtendRollupOpts)
    )
  );

  return clientConfig.input.map(inputPath => {
    return {
      input: path.resolve(rootPath, inputPath),
      output: {
        dir: path.resolve(cwd, "dist/client"),
        format: "iife",
        sourcemap: true
      },
      external: rollupOpts.external,
      plugins: [
        babel(rollupOpts.babel),
        alias(rollupOpts.alias),
        json(),
        resolve(rollupOpts.resolve),
        commonjs(rollupOpts.commonjs),
        replace(rollupOpts.replace),
        minify && terser()
      ].filter(Boolean)
    };
  });
}
