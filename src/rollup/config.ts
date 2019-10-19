import path from 'path'
import {RollupOptions} from 'rollup'
import alias from 'rollup-plugin-alias'
import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import json from 'rollup-plugin-json'
import resolve from 'rollup-plugin-node-resolve'
import replace from 'rollup-plugin-replace'
import {terser} from 'rollup-plugin-terser'
import {noopPluginFn} from '../helpers'
import {BuildConfig, Config, PluginFn} from '../types'
import {applyRollupPlugins} from './helpers'
import {RollupOpts} from './types'

interface Opts {
  buildConfig: BuildConfig
  cwd: string
  envConfig: {[key: string]: string}
  minify?: boolean
  pkg: {
    alias?: {[key: string]: string}
  }
  pluginFn: PluginFn
  plugins: Config[]
  useBabel: boolean
}

export function buildRollupConfig(opts: Opts): RollupOptions {
  const extensions = ['.ts', '.tsx', '.es6', '.es', '.jsx', '.js', '.mjs']
  const {cwd, buildConfig, envConfig, minify, pkg, pluginFn, plugins} = opts
  const dirPath = path.resolve(cwd, buildConfig.dir)
  const aliasConfig = pkg.alias || {}
  const rollupOpts: RollupOpts = applyRollupPlugins(
    {
      alias: {
        entries: Object.keys(aliasConfig).map(find => ({
          find,
          replacement: path.resolve(cwd, aliasConfig[find])
        }))
      },
      babel: {
        exclude: 'node_modules/**',
        extensions,
        root: cwd
      },
      commonjs: {
        sourceMap: true
      },
      external: buildConfig.target === 'server' ? ['micro'] : [],
      replace: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        ...Object.keys(envConfig).reduce(
          (curr, k) => {
            curr[`process.env.${k}`] = JSON.stringify(envConfig[k])
            return curr
          },
          {} as any
        )
      },
      resolve: {
        extensions,
        mainFields:
          buildConfig.target === 'browser' ? ['browser', 'module', 'main'] : ['module', 'main']
      },
      terser: {}
    },
    buildConfig,
    [pluginFn].concat(plugins.map(p => p.extendRollup || noopPluginFn))
  )

  return {
    external: rollupOpts.external,
    input: path.resolve(cwd, buildConfig.src),
    output: {
      dir: dirPath,
      format: buildConfig.format || (buildConfig.target === 'server' ? 'cjs' : 'iife'),
      sourcemap: true
    },
    plugins: [
      opts.useBabel && babel(rollupOpts.babel),
      alias(rollupOpts.alias),
      json(),
      resolve(rollupOpts.resolve),
      replace(rollupOpts.replace),
      commonjs(rollupOpts.commonjs),
      minify && terser()
    ].filter(Boolean)
  }
}
