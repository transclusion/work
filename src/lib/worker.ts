import path from 'path'
import {BuildConfig, Config} from '../types'
// import {parentPort, workerData} from 'worker_threads'
import {findConfig, findEnvConfig, findPlugins} from './helpers'

export interface WorkerContext {
  buildConfig: BuildConfig
  config: Config
  configIdx: number
  cwd: string
  data: any
  envConfig: {[key: string]: string}
  plugins: Config[]
  pkg: any
  postMessage: (msg: any) => void
}

export function getContext(): WorkerContext {
  // const _parentPort = parentPort
  const data = JSON.parse(process.env.__DATA || '{}')
  const cwd: string = data.cwd
  const configIdx: number = data.configIdx
  const buildConfigIdx: number = data.buildConfigIdx

  if (typeof cwd !== 'string') {
    throw new Error('Missing `cwd` in workerData')
  }
  if (typeof configIdx !== 'number') {
    throw new Error('Missing `configIdx` in workerData')
  }
  if (typeof buildConfigIdx !== 'number') {
    throw new Error('Missing `buildConfigIdx` in workerData')
  }
  // if (!_parentPort) {
  //   throw new Error('Missing `parentPort`')
  // }

  // tslint:disable-next-line variable-name
  const configs = findConfig(cwd)
  const config: any = configs[configIdx]
  if (!config.builds) {
    throw new Error('No configured builds')
  }
  const buildConfig: any = config.builds[buildConfigIdx]
  const plugins = findPlugins(cwd, config.plugins || [])
  const envConfig = findEnvConfig(cwd)
  // tslint:disable-next-line no-var-requires
  const pkg: any = require(path.resolve(cwd, 'package.json'))

  return {buildConfig, config, configIdx, cwd, data, envConfig, plugins, pkg, postMessage}

  function postMessage(msg: any) {
    // _parentPort.postMessage(msg)
    ;(process as any).send(msg)
  }
}
