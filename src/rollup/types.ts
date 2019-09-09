export interface RollupAliasConfig {
  entries: Array<{
    find: string;
    replacement: string;
  }>;
}

export interface RollupBabelConfig {
  root: string;
  exclude: string | string[];
  extensions: string[];
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

export interface RollupOpts {
  alias: RollupAliasConfig;
  babel: RollupBabelConfig;
  commonjs: RollupCommonJSConfig;
  external: RollupExternalConfig;
  replace: RollupReplaceConfig;
  resolve: RollupResolveConfig;
  terser: RollupTerserConfig;
}
