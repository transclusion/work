import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import resolve from "resolve";
import { RollupOpts } from "./rollup/types";
import { Config, PluginConfig } from "./types";

function dep(m: any) {
  return m.default || m;
}

export function findConfig(cwd: string): Config {
  const configPath = path.resolve(cwd, "work.config.js");
  return dep(require(configPath));
}

function requireEnvFile(filePath: string) {
  try {
    return dotenv.parse(fs.readFileSync(filePath));
  } catch (_) {
    return {};
  }
}

export function findEnvConfig(cwd: string) {
  const envName = process.env.NODE_ENV;
  return {
    ...requireEnvFile(path.resolve(cwd, ".env")),
    ...(envName ? requireEnvFile(path.resolve(cwd, `.env.${envName}`)) : {}),
    ...(envName ? requireEnvFile(path.resolve(cwd, `.env.${envName}.local`)) : {})
  };
}

export function findPlugins(cwd: string, pluginConfig: PluginConfig): Config[] {
  return pluginConfig.map(pluginId => {
    const pluginPath = resolve.sync(pluginId, { basedir: cwd });
    return dep(require(pluginPath));
  });
}

export function readFile(filePath: string) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, buf) => {
      if (err) reject(err);
      else resolve(buf);
    });
  });
}

export function noopPluginFn(opts: RollupOpts): RollupOpts {
  return opts;
}
