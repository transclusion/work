import {IncomingMessage, ServerResponse} from 'http'
import {ModuleFormat} from 'rollup'
import {RollupOpts} from './rollup/types'

export type IdentityFn<Identity> = (value: Identity) => Identity

export interface BrowserConfig {
  basePath?: string
  context?: string
  input?: string[]
}

export interface ServerConfig {
  context?: string
  routes?: {
    [key: string]: string
  }
}

export interface BuildConfig {
  src: string
  target: 'browser' | 'server' | 'static'
  format?: ModuleFormat
  dir: string
}

export interface RouteConfig {
  src: string
  dest: string
}

export interface RouteMatch {
  route: RouteConfig
  params: {[key: string]: string}
  path: string
}

export type PluginConfig = string[]

export type PluginFn = (rollupOpts: RollupOpts, buildConfig: BuildConfig) => RollupOpts

export interface Config {
  builds?: BuildConfig[]
  routes?: RouteConfig[]
  plugins?: PluginConfig
  extendRollup?: PluginFn
}

export interface Logger {
  error: (...args: any[]) => void
  info: (...args: any[]) => void
}

export type Middleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => any
