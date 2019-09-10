import {findConfig} from '../helpers'
import {Logger} from '../types'
import {initWorker} from './helpers'

interface Opts {
  cwd?: string
  logger?: Logger
}

function rollupBuild(cwd: string, buildConfigIdx: number, target: string) {
  return new Promise((resolve, reject) => {
    const worker = initWorker(cwd, buildConfigIdx, target)
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

async function build(opts: Opts) {
  const cwd = opts.cwd
  if (!cwd) {
    throw new Error('Missing cwd')
  }
  const config = findConfig(cwd)

  await Promise.all(
    (config.builds || []).map((buildConfig, buildConfigIdx) => {
      return rollupBuild(cwd, buildConfigIdx, buildConfig.target)
    })
  )
}

export default build
