import child_process from 'child_process'
import path from 'path'
// import {Worker} from 'worker_threads'
import {BuildConfig} from '../types'

export function initWorkers(cwd: string, builds: BuildConfig[], configIdx: number) {
  return builds.map((buildConfig, buildConfigIdx) => {
    return {
      buildConfig,
      // worker: new Worker(path.resolve(__dirname, './worker.js'), {
      //   env: {
      //     BABEL_ENV: buildConfig.target,
      //     NODE_ENV: process.env.NODE_ENV || 'development'
      //   },
      //   workerData: {
      //     buildConfigIdx,
      //     configIdx,
      //     cwd
      //   }
      // } as any),
      worker: child_process.fork(path.resolve(__dirname, './worker.js'), [], {
        env: {
          BABEL_ENV: buildConfig.target,
          NODE_ENV: process.env.NODE_ENV || 'development',
          __DATA: JSON.stringify({
            buildConfigIdx,
            configIdx,
            cwd
          })
        }
      })
    }
  })
}
