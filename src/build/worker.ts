import cpx from 'cpx'
// import {parentPort, workerData} from 'worker_threads'
import {detectBabel} from '../lib/detectBabel'
import {noopPluginFn} from '../lib/helpers'
import {getContext, WorkerContext} from '../lib/worker'
import {buildRollupConfig} from '../rollup/config'
import {rollupBuild} from './helpers'

function postMessage(msg: any) {
  ;(process as any).send(msg)
}

async function startRollupWorker(ctx: WorkerContext) {
  try {
    const useBabel = await detectBabel({cwd: ctx.cwd})

    const rollupConfig = await buildRollupConfig({
      buildConfig: ctx.buildConfig,
      cwd: ctx.cwd,
      envConfig: ctx.envConfig,
      minify: true,
      pkg: ctx.pkg,
      pluginFn: ctx.config.extendRollup || noopPluginFn,
      plugins: ctx.plugins,
      useBabel
    })

    await rollupBuild(rollupConfig)
    // _parentPort.postMessage({type: 'complete'})
    postMessage({type: 'complete'})
  } catch (error) {
    // _parentPort.postMessage({error: 'error', message: err.message, stack: err.stack})
    postMessage({error: 'error', message: error.message, stack: error.stack})
  }
}

function startStaticWorker(ctx: WorkerContext) {
  cpx.copy(ctx.buildConfig.src, ctx.buildConfig.dir, (err: any) => {
    if (err) {
      postMessage({error: 'error', message: err.message, stack: err.stack})
    } else {
      postMessage({type: 'complete'})
    }
  })
}

async function startWorker() {
  const ctx = getContext()

  if (['browser', 'server'].indexOf(ctx.buildConfig.target) > -1) {
    startRollupWorker(ctx)
  } else if (ctx.buildConfig.target === 'static') {
    startStaticWorker(ctx)
  } else {
    const err = new Error(`Unknown target: ${ctx.buildConfig.target}`)
    postMessage({error: 'error', message: err.message, stack: err.stack})
  }
}

startWorker()
