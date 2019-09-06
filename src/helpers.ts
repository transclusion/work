import path from "path";
import { Config } from "./types";

function dep(m: any) {
  return m.default || m;
}

export function findConfig(cwd: string): Config {
  return dep(require(path.resolve(cwd, "work.config")));
}

export function updateOrDefault<T>(value: T, updateFn?: (v: T) => T) {
  return updateFn ? updateFn(value) : value;
}
