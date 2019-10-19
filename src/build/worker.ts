import cpx from 'cpx'
import path from 'path'
import {parentPort, workerData} from 'worker_threads'
import {findConfig, findEnvConfig, findPlugins, noopPluginFn} from '../helpers'
import {detectBabel} from '../lib/detectBabel'
import {buildRollupConfig} from '../rollup/config'
import {rollupBuild} from './helpers'

const cwd: string = workerData.cwd
const configIdx: number = workerData.configIdx
const buildConfigIdx: number = workerData.buildConfigIdx

if (typeof cwd !== 'string') {
  throw new Error('Missing `cwd` in workerData')
}
if (typeof configIdx !== 'number') {
  throw new Error('Missing `configIdx` in workerData')
}
if (typeof buildConfigIdx !== 'number') {
  throw new Error('Missing `buildConfigIdx` in workerData')
}
if (!parentPort) {
  throw new Error('Missing `parentPort`')
}

// tslint:disable-next-line variable-name
const _parentPort = parentPort
const configs = findConfig(cwd)
const config = configs[configIdx]
if (!config.builds) {
  throw new Error('No configured builds')
}
const buildConfig = config.builds[buildConfigIdx]
const plugins = findPlugins(cwd, config.plugins || [])
const envConfig = findEnvConfig(cwd)
// tslint:disable-next-line no-var-requires
const pkg = require(path.resolve(cwd, 'package.json'))

async function startWorker() {
  const useBabel = await detectBabel({cwd})

  if (['browser', 'server'].indexOf(buildConfig.target) > -1) {
    const rollupConfig = buildRollupConfig({
      buildConfig,
      cwd,
      envConfig,
      minify: true,
      pkg,
      pluginFn: config.extendRollup || noopPluginFn,
      plugins,
      useBabel
    })

    rollupBuild(rollupConfig)
      .then(() => {
        _parentPort.postMessage({type: 'complete'})
      })
      .catch(err => {
        _parentPort.postMessage({error: 'error', message: err.message, stack: err.stack})
      })
  } else if (buildConfig.target === 'static') {
    cpx.copy(buildConfig.src, buildConfig.dir, (err: any) => {
      if (err) {
        throw err
      }
    })
  } else {
    throw new Error(`Unknown target: ${buildConfig.target}`)
  }
}

startWorker()
