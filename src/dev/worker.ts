import cpx from 'cpx'
import {watch as rollupWatch} from 'rollup'
import {detectBabel} from '../lib/detectBabel'
import {noopPluginFn} from '../lib/helpers'
import {buildRollupConfig} from '../rollup/config'

import {getContext, WorkerContext} from '../lib/worker'

function cloneRollupEvent(ctx: WorkerContext, event: any) {
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
        stack: event.error.stack ? event.error.stack.replace(ctx.cwd, '.') : null
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

async function startRollupWorker(ctx: WorkerContext) {
  const useBabel = await detectBabel({cwd: ctx.cwd})

  const rollupConfig = await buildRollupConfig({
    buildConfig: ctx.buildConfig,
    cwd: ctx.cwd,
    envConfig: ctx.envConfig,
    pkg: ctx.pkg,
    pluginFn: ctx.config.extendRollup || noopPluginFn,
    plugins: ctx.plugins,
    useBabel
  })

  const watcher = rollupWatch([rollupConfig])

  watcher.on('event', event => {
    ctx.postMessage(cloneRollupEvent(ctx, event))
  })
}

function startStaticWorker(ctx: WorkerContext) {
  const watcher = cpx.watch(ctx.buildConfig.src, ctx.buildConfig.dir)

  watcher.on('copy', evt => {
    ctx.postMessage({code: 'static.copy', src: evt.srcPath, dest: evt.dstPath})
  })

  watcher.on('remove', evt => {
    ctx.postMessage({code: 'static.remove', path: evt.path})
  })

  watcher.on('watch-error', evt => {
    // tslint:disable-next-line no-console
    console.log('TODO: watch-error', evt)
    ctx.postMessage({code: 'static.watch-error'})
  })
}

async function startWorker() {
  const ctx = getContext()
  const buildTarget = ctx.buildConfig.target || 'static'

  if (['browser', 'server'].includes(buildTarget)) {
    await startRollupWorker(ctx)
  } else if (buildTarget === 'static') {
    startStaticWorker(ctx)
  } else {
    throw new Error(`Unknown target: ${buildTarget}`)
  }
}

startWorker()
