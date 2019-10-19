import path from 'path'
import {rollup, RollupOptions} from 'rollup'
import {Worker} from 'worker_threads'

export function initWorker(cwd: string, configIdx: number, buildConfigIdx: number, target: string) {
  return new Worker(path.resolve(__dirname, './worker.js'), {
    env: {
      BABEL_ENV: target,
      NODE_ENV: process.env.NODE_ENV || 'development'
    },
    workerData: {
      buildConfigIdx,
      configIdx,
      cwd
    }
  } as any)
}

export async function rollupBuild(rollupConfig: RollupOptions) {
  const {output: outputOptions, ...inputOptions} = rollupConfig
  const bundle = await rollup(inputOptions)

  if (!outputOptions) {
    throw new Error('missing output options')
  }

  return bundle.write(outputOptions)
}
