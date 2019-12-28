import {findConfig} from '../lib/helpers'
import {Config, Logger} from '../types'
import {initWorker} from './helpers'

interface Opts {
  cwd?: string
  logger?: Logger
}

function buildInWorker(cwd: string, configIdx: number, buildConfigIdx: number, target: string) {
  return new Promise((resolve, reject) => {
    const worker = initWorker(cwd, configIdx, buildConfigIdx, target)

    worker.on('message', (event: any) => {
      if (event.type === 'complete') {
        resolve()
        return
      }

      if (event.type === 'error') {
        reject(new Error(event.message))
        return
      }

      reject(new Error(`unhandled event: ${event.message}`))
    })
  })
}

function startBuild(cwd: string, config: Config, configIdx: number) {
  const buildConfigs = config.builds || []

  return Promise.all(
    buildConfigs.map((buildConfig, buildConfigIdx) =>
      buildInWorker(cwd, configIdx, buildConfigIdx, buildConfig.target)
    )
  )
}

function build(opts: Opts) {
  const cwd = opts.cwd

  if (!cwd) {
    throw new Error('Missing cwd')
  }

  const configs = findConfig(cwd)

  return Promise.all(configs.map((config, configIdx) => startBuild(cwd, config, configIdx)))
}

export default build
