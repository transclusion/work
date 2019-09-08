import fs from "fs";
import path from "path";
import pathToRegexp from "path-to-regexp";
import resolve from "resolve";
import { Config } from "./types";

function dep(m: any) {
  return m.default || m;
}

export function findConfig(cwd: string): Config {
  const configPath = path.resolve(cwd, "work.config.js");
  return dep(require(configPath));
}

export function findPlugins(cwd: string, config: Config): Config[] {
  if (config.plugins) {
    return config.plugins.map(pluginId => {
      const pluginPath = resolve.sync(pluginId, { basedir: cwd });
      const pluginDir = path.dirname(pluginPath);
      return findConfig(pluginDir);
    });
  }

  return [];
}

export function matchRoute(routes: any, url: string): { path: string } | null {
  let match = null;
  Object.keys(routes).some(routePattern => {
    const keys: any[] = [];
    const regexp = pathToRegexp(routePattern, keys);
    const result = regexp.exec(url);
    if (result) {
      match = {
        path: routes[routePattern],
        params: keys.reduce((curr, x, i) => {
          curr[typeof x.name === "number" ? `$${x.name}` : x.name] = result[i + 1];
          return curr;
        }, {})
      };
      return true;
    }
    return false;
  });
  return match;
}

export function readFile(filePath: string) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, buf) => {
      if (err) reject(err);
      else resolve(buf);
    });
  });
}
