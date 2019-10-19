import cpx from 'cpx'
import path from 'path'
import {watch as rollupWatch} from 'rollup'
import {parentPort, workerData} from 'worker_threads'
import {findConfig, findEnvConfig, findPlugins, noopPluginFn} from '../helpers'
import {detectBabel} from '../lib/detectBabel'
import {buildRollupConfig} from '../rollup/config'

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

function cloneRollupEvent(event: any) {
  if (event.code === 'BUNDLE_END') {
    return {
      code: 'rollup.BUNDLE_END',
      input: event.input,
      output: event.output
    }
  }
  if (event.code === 'ERROR') {
    return {
      code: 'rollup.ERROR',
      error: {
        message: event.error.message,
        stack: event.error.stack ? event.error.stack.replace(cwd, '.') : null
      }
    }
  }
  if (event.code === 'FATAL') {
    return {
      code: 'rollup.FATAL',
      error: {message: event.error.message, stack: event.error.stack}
    }
  }
  return {code: `rollup.${event.code}`}
}

async function startWorker() {
  const useBabel = await detectBabel({cwd})

  if (['browser', 'server'].indexOf(buildConfig.target) > -1) {
    const rollupConfig = buildRollupConfig({
      buildConfig,
      cwd,
      envConfig,
      pkg,
      pluginFn: config.extendRollup || noopPluginFn,
      plugins,
      useBabel
    })
    const watcher = rollupWatch([rollupConfig])
    watcher.on('event', event => {
      _parentPort.postMessage(cloneRollupEvent(event))
    })
  } else if (buildConfig.target === 'static') {
    const watcher = cpx.watch(buildConfig.src, buildConfig.dir)
    watcher.on('copy', evt => {
      _parentPort.postMessage({code: 'cpx.copy', src: evt.srcPath, dest: evt.dstPath})
    })
    watcher.on('remove', evt => {
      _parentPort.postMessage({code: 'cpx.remove', path: evt.path})
    })
    watcher.on('watch-error', evt => {
      // tslint:disable-next-line no-console
      console.log('TODO: watch-error', evt)
      _parentPort.postMessage({code: 'cpx.watch-error'})
    })
  } else {
    throw new Error(`Unknown target: ${buildConfig.target}`)
  }
}

startWorker()
