import micro from 'micro'
import path from 'path'
import {appHandler} from '../app'
import {findConfig} from '../helpers'
import {Logger} from '../types'
import {eventSource} from './eventSource'
import {initWorkers} from './helpers'

interface Opts {
  cwd?: string
  logger?: Logger
  port?: string | number | undefined
}

const DEFAULT_LOGGER: Logger = {
  error(...args) {
    // tslint:disable-next-line no-console
    console.error('[work]', ...args)
  },
  info(...args) {
    // tslint:disable-next-line no-console
    console.log('[work]', ...args)
  }
}

type ListenCallback = ((handleListen: any) => void) | (() => void)

function dev(opts: Opts) {
  if (!opts.cwd) {
    throw new Error('`cwd` is missing in options')
  }

  const logger = opts.logger || DEFAULT_LOGGER
  const cwd = opts.cwd
  const config = findConfig(cwd)
  const port = opts.port || 3000

  const listen = (cb?: ListenCallback) => {
    const es = eventSource()
    const workers = initWorkers(cwd, config.builds)

    workers.forEach(({buildConfig, worker}) => {
      worker.on('error', event => {
        // tslint:disable-next-line no-console
        console.log(`TODO: ${buildConfig.target} worker:`, event)
      })
      worker.on('message', event => {
        if (event.code === 'cpx.copy') {
          logger.info('Copied', event.src, '>', event.dest)
        } else if (event.code === 'cpx.remove') {
          logger.info('Removed', event.path)
        } else if (event.code === 'rollup.BUNDLE_END') {
          logger.info('Built', path.relative(cwd, event.input))
          if (buildConfig.target === 'server') {
            event.output.forEach((distPrefix: string) => {
              Object.keys(require.cache).forEach(filePath => {
                if (filePath.startsWith(distPrefix)) {
                  delete require.cache[filePath]
                }
              })
            })
          }
        } else if (event.code === 'rollup.ERROR') {
          logger.error(event.error.stack)
          process.exit(1)
        } else if (event.code === 'rollup.FATAL') {
          logger.error(event.error.stack)
          process.exit(1)
        }
        es.send(buildConfig.target, event)
      })
    })

    async function handler(req: any, res: any) {
      try {
        await es.middleware(req, res, async () => {
          logger.info(req.method, req.url)
          const patchedRes: any = res
          // tslint:disable-next-line variable-name
          const _end = res.end.bind(res)
          patchedRes.end = (body: any) =>
            _end(
              String(body).replace('</body>', '<script src="/__work__/reload.js"></script></body>')
            )
          await appHandler(cwd, config, req, patchedRes)
        })
      } catch (err) {
        res.end(err.stack)
      }
    }

    const server = micro(handler)

    server.listen(port, () => {
      logger.info(`Listening at http://localhost:${port}`)
    })

    if (cb) {
      cb(function close() {
        server.close()
        workers.forEach(({worker}) => {
          worker.terminate()
        })
      })
    }
  }

  return {listen}
}

export default dev
