import getPort from 'get-port'
import {IncomingMessage, ServerResponse} from 'http'
import micro from 'micro'
// import path from 'path'
import {appHandler} from '../app'
import {findConfig} from '../lib/helpers'
import {Config, Logger} from '../types'
import {initWorkers} from './helpers'
import {hotReload} from './hotReload'
import {HotReload} from './types'

interface Opts {
  cwd?: string
  logger?: Logger
}

interface Server {
  close: () => void
  port: number
}

type ListenCallback = (ctx: {close: () => void; servers: Server[]}) => void

const PREFERRED_PORTS = [3000, 3001, 3002, 3003, 3004, 3005]

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

async function startServer(
  cwd: string,
  config: Config,
  configIdx: number,
  es: HotReload,
  logger: Logger
): Promise<Server> {
  // logger.info('start server')

  const port = config.port || (await getPort({port: PREFERRED_PORTS}))
  const workers = initWorkers(cwd, config.builds || [], configIdx)

  workers.forEach(({buildConfig, worker}) => {
    worker.on('error', event => {
      // tslint:disable-next-line no-console
      console.log(`TODO: ${buildConfig.target} worker:`, event)
    })

    worker.on('message', (event: any) => {
      if (event.code === 'static.copy') {
        // logger.info('Copied', event.src, '>', event.dest)
      } else if (event.code === 'static.remove') {
        // logger.info('Removed', event.path)
      } else if (event.code === 'rollup.BUNDLE_END') {
        // logger.info('Built', path.relative(cwd, event.input))
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
      } else if (event.code === 'rollup.FATAL') {
        logger.error(event.error.stack)
        process.exit(1)
      }

      es.postMessage(buildConfig.target, event)
    })
  })

  async function handler(req: IncomingMessage, res: ServerResponse) {
    // const status = 200
    ;(res as any).status = (code: number) => res.writeHead(code, {})
    logger.info(req.method, req.url)
    try {
      await es.middleware(req, res, async () => {
        await appHandler(cwd, config, req, res, (body, mimeType) => {
          logger.info(`mime-type: ${mimeType}`)

          if (mimeType === 'text/html') {
            res.end(
              String(body || '').replace(
                '</body>',
                '<script src="/__work__/reload.js"></script></body>'
              )
            )
          } else {
            res.end(body)
          }
        })
      })
    } catch (err) {
      res.end(err.stack)
    }
  }

  const server = micro(handler)

  server.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`)
  })

  return {
    close() {
      server.close()
      workers.forEach(({worker}) => {
        // worker.terminate()
        worker.kill()
      })
    },
    port
  }
}

function dev(opts: Opts) {
  if (!opts.cwd) {
    throw new Error('`cwd` is missing in options')
  }

  const logger = opts.logger || DEFAULT_LOGGER
  const cwd = opts.cwd
  const configs = findConfig(cwd)

  const listen = async (cb?: ListenCallback) => {
    const es = hotReload()

    const servers = await Promise.all(
      configs.map((config, configIdx) => startServer(cwd, config, configIdx, es, logger))
    )

    if (cb) {
      cb({
        close() {
          servers.forEach(server => {
            server.close()
          })
        },
        servers
      })
    }
  }

  return {listen}
}

export default dev
