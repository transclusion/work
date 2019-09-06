import path from "path";
import alias from "rollup-plugin-alias";
import babel from "rollup-plugin-babel";
import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";
import json from "rollup-plugin-json";
import replace from "rollup-plugin-replace";
import { terser } from "rollup-plugin-terser";
import { updateOrDefault } from "../helpers";
import { RollupConfig } from "../types";
import { Opts } from "./types";

export function getClientConfig(opts: Opts) {
  const { config, envConfig, cwd, minify, pkg } = opts;
  const clientConfig = config.client;

  if (!clientConfig || !clientConfig.input) return null;

  const rollupUpdateFns = config.rollup || {};
  const rootPath = path.resolve(cwd, clientConfig.context || ".");
  const aliasConfig = pkg.alias || {};
  const rollupDefaults: RollupConfig = {
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
  };

  return clientConfig.input.map(inputPath => {
    return {
      input: path.resolve(rootPath, inputPath),
      output: {
        dir: path.resolve(cwd, "dist/client"),
        format: "iife",
        sourcemap: true
      },
      external: updateOrDefault(rollupDefaults.external, rollupUpdateFns.external),
      plugins: [
        babel(updateOrDefault(rollupDefaults.babel, rollupUpdateFns.babel)),
        alias(updateOrDefault(rollupDefaults.alias, rollupUpdateFns.alias)),
        json(),
        resolve(updateOrDefault(rollupDefaults.resolve, rollupUpdateFns.resolve)),
        commonjs(updateOrDefault(rollupDefaults.commonjs, rollupUpdateFns.commonjs)),
        replace(updateOrDefault(rollupDefaults.replace, rollupUpdateFns.replace)),
        minify && terser()
      ].filter(Boolean)
    };
  });
}
