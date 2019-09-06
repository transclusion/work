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

export function getServerConfig(opts: Opts) {
  const { config, envConfig, cwd, minify, pkg } = opts;
  const serverConfig = config.server;

  if (!serverConfig || !serverConfig.routes) return null;

  const routesConfig = serverConfig.routes;
  const rollupExtendFns = config.rollup || {};
  const rootPath = path.resolve(cwd, serverConfig.context || ".");
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
    commonjs: { sourceMap: true },
    external: ["micro"],
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
    resolve: {
      extensions: [".ts", ".tsx", ".es6", ".es", ".jsx", ".js", ".mjs"],
      mainFields: ["module", "main"]
    },
    terser: {}
  };

  return Object.keys(serverConfig.routes).map(routePattern => {
    const inputPath = routesConfig[routePattern];

    return {
      input: path.resolve(rootPath, inputPath),
      output: {
        dir: path.resolve(cwd, "dist/server"),
        format: "cjs",
        sourcemap: true
      },
      external: updateOrDefault(rollupDefaults.external, rollupExtendFns.external),
      plugins: [
        babel(updateOrDefault(rollupDefaults.babel, rollupExtendFns.babel)),
        alias(updateOrDefault(rollupDefaults.alias, rollupExtendFns.alias)),
        json(),
        resolve(updateOrDefault(rollupDefaults.resolve, rollupExtendFns.resolve)),
        commonjs(updateOrDefault(rollupDefaults.commonjs, rollupExtendFns.commonjs)),
        replace(updateOrDefault(rollupDefaults.replace, rollupExtendFns.replace)),
        minify && terser()
      ].filter(Boolean)
    };
  });
}
