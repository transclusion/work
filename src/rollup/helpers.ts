import {BuildConfig, PluginFn} from '../types'
import {RollupOpts} from './types'

export function applyRollupPlugins(
  rollupOpts: RollupOpts,
  buildConfig: BuildConfig,
  pluginFns: PluginFn[]
): RollupOpts {
  return pluginFns.reduce((currRollupOpts, pluginFn) => {
    return pluginFn(currRollupOpts, buildConfig)
  }, rollupOpts)
}
