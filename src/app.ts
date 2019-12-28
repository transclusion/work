import fs from 'fs'
import {IncomingMessage, ServerResponse} from 'http'
import mimeTypes from 'mime-types'
import minimatch from 'minimatch'
import path from 'path'
import {pathToRegexp} from 'path-to-regexp'
import {BuildConfig, Config, RouteConfig, RouteMatch} from './types'

export function matchRoute(routes: RouteConfig[], url: string): RouteMatch | null {
  for (const route of routes) {
    const keys: any[] = []
    const re = pathToRegexp(route.src, keys)
    const result = re.exec(url)
    if (result) {
      const params = keys.reduce((curr, x, i) => {
        curr[typeof x.name === 'number' ? `$${x.name + 1}` : x.name] = result[i + 1]
        return curr
      }, {})
      return {
        params,
        path: Object.keys(params).reduce((curr: string, key: string) => {
          return curr.replace(key, params[key])
        }, route.dest),
        route
      }
    }
  }
  return null
}

function resolveBuildFile(dir: string, src: string) {
  const info = path.parse(src)
  // TODO: check if extension is supported
  return path.resolve(dir, `${info.name}.js`)
}

export function matchBuild(
  cwd: string,
  builds: BuildConfig[],
  relReqFilePath: string
): BuildConfig | null {
  for (const build of builds) {
    const reqFilePath = path.resolve(cwd, relReqFilePath)
    const buildFilePath = resolveBuildFile(path.resolve(cwd, build.dir), build.src)
    if (minimatch(reqFilePath, buildFilePath)) {
      return build
    }
  }
  return null
}

export async function appHandler(
  cwd: string,
  config: Config,
  req: IncomingMessage,
  res: ServerResponse,
  send: (body: any, mimeType: string) => void
) {
  const match = matchRoute(config.routes || [], req.url || '/')

  if (!match) {
    const mimeType = 'text/plain'
    res.writeHead(404, {'content-type': mimeType})
    send(`Not found: ${req.url}`, mimeType)
    return
  }

  const build = matchBuild(cwd, config.builds || [], match.path)

  if ((build && build.target === 'browser') || !build) {
    const staticFile = path.resolve(cwd, match.path)
    const mimeType = mimeTypes.lookup(staticFile)

    res.writeHead(200, {'Content-Type': mimeType || 'text/plain'})
    fs.createReadStream(staticFile, {encoding: 'utf8'}).pipe(res)
    return
  } else if (build && build.target === 'server') {
    const serverFile = resolveBuildFile(path.resolve(cwd, build.dir), match.path)
    require(serverFile)(req, res)
    return
  } else if (build) {
    const mimeType = 'text/plain'
    res.writeHead(500, {'content-type': mimeType})
    send(`Unknown build target: ${build.target}`, mimeType)
    return
  }

  res.writeHead(404, {'content-type': 'text/plain'})
  send(`Not found: ${req.url}`, 'text/plain')
}
