export interface RollupAliasConfig {
  entries: Array<{
    find: string;
    replacement: string;
  }>;
}

export interface RollupBabelConfig {
  babelrc: boolean;
  exclude: string | string[];
  extensions: string[];
  presets: string[];
}

export interface RollupCommonJSConfig {
  sourceMap?: boolean;
  namedExports?: {
    [key: string]: string[];
  };
}

export type RollupExternalConfig = string[];

export interface RollupReplaceConfig {
  [key: string]: string;
}

export interface RollupResolveConfig {
  extensions?: string[];
  mainFields?: string[];
}

export interface RollupTerserConfig {}

export interface RollupConfig {
  alias: RollupAliasConfig;
  babel: RollupBabelConfig;
  commonjs: RollupCommonJSConfig;
  external: RollupExternalConfig;
  replace: RollupReplaceConfig;
  resolve: RollupResolveConfig;
  terser: RollupTerserConfig;
}

type IdentityFn<Identity> = (value: Identity) => Identity;

export interface RollupUpdateFns {
  alias?: IdentityFn<RollupAliasConfig>;
  babel?: IdentityFn<RollupBabelConfig>;
  commonjs?: IdentityFn<RollupCommonJSConfig>;
  external?: IdentityFn<RollupExternalConfig>;
  replace?: IdentityFn<RollupReplaceConfig>;
  resolve?: IdentityFn<RollupResolveConfig>;
  terser?: IdentityFn<RollupTerserConfig>;
}

interface ClientConfig {
  context?: string;
  input?: string[];
}

interface ServerConfig {
  context?: string;
  routes?: {
    [key: string]: string;
  };
  port?: number | string;
}

export interface Config {
  client?: ClientConfig;
  server?: ServerConfig;
  rollup?: RollupUpdateFns;
}

export interface Logger {
  error: (...args: any[]) => void;
  info: (...args: any[]) => void;
}
