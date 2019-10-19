import {findConfig} from '../helpers'
import {Config, Logger} from '../types'
import {initWorker} from './helpers'

interface Opts {
  cwd?: string
  logger?: Logger
}

function buildInWorker(cwd: string, configIdx: number, buildConfigIdx: number, target: string) {
  return new Promise((resolve, reject) => {
    const worker = initWorker(cwd, configIdx, buildConfigIdx, target)

    worker.on('message', event => {
      if (event.type === 'complete') {
        resolve()
      }

      if (event.type === 'error') {
        reject(new Error(event.message))
      }
    })
  })
}

function startBuild(cwd: string, config: Config, configIdx: number) {
  const buildConfigs = config.builds || []

  return buildConfigs.map((buildConfig, buildConfigIdx) =>
    buildInWorker(cwd, configIdx, buildConfigIdx, buildConfig.target)
  )
}

async function build(opts: Opts) {
  const cwd = opts.cwd

  if (!cwd) {
    throw new Error('Missing cwd')
  }

  const configs = findConfig(cwd)

  await Promise.all(configs.map((config, configIdx) => startBuild(cwd, config, configIdx)))
}

export default build
