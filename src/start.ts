import getPort from 'get-port'
import micro from 'micro'
import {appHandler} from './app'
import {findConfig} from './helpers'
import {Config, Logger} from './types'

interface Opts {
  cwd: string
  logger: Logger
  port?: string | number
}

const PREFERRED_PORTS = [3000, 3001, 3002, 3003, 3004, 3005]

async function startServer(cwd: string, config: Config, logger: Logger) {
  const port = config.port || (await getPort({port: PREFERRED_PORTS}))

  async function handler(req: any, res: any) {
    try {
      logger.info(req.method, req.url)
      await appHandler(cwd, config, req, res, (body, _) => {
        res.end(body)
      })
    } catch (err) {
      res.end(err.stack)
    }
  }

  const server = micro(handler)

  server.listen(Number(port), () => {
    logger.info(`Listening at http://localhost:${port}`)
  })
}

async function start(opts: Opts) {
  const {cwd, logger} = opts
  const configs = findConfig(cwd)

  return Promise.all(configs.map(config => startServer(cwd, config, logger)))
}

export default start
