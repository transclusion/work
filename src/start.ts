import micro from 'micro'
import {appHandler} from './app'
import {findConfig} from './helpers'
import {Logger} from './types'

interface Opts {
  cwd: string
  logger: Logger
  port?: string | number
}

async function start(opts: Opts) {
  return new Promise(resolve => {
    const {cwd, logger} = opts
    const config = findConfig(cwd)
    const port = opts.port || 3000

    async function handler(req: any, res: any) {
      try {
        logger.info(req.method, req.url)
        await appHandler(cwd, config, req, res)
      } catch (err) {
        res.end(err.stack)
      }
    }

    const server = micro(handler)

    server.listen(Number(port), () => {
      logger.info(`Listening at http://localhost:${port}`)
      resolve()
    })
  })
}

export default start
