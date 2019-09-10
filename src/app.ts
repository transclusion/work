import { IncomingMessage, ServerResponse } from "http";
import mimeTypes from "mime-types";
import path from "path";
import pathToRegexp from "path-to-regexp";
import { readFile } from "./helpers";
import { BuildConfig, Config, RouteConfig, RouteMatch } from "./types";

export function matchRoute(routes: RouteConfig[], url: string): RouteMatch | null {
  for (const route of routes) {
    const keys: any[] = [];
    const re = pathToRegexp(route.src, keys);
    const result = re.exec(url);
    if (result) {
      const params = keys.reduce((curr, x, i) => {
        curr[typeof x.name === "number" ? `$${x.name + 1}` : x.name] = result[i + 1];
        return curr;
      }, {});
      return {
        route,
        params,
        path: Object.keys(params).reduce((curr: string, key: string) => {
          return curr.replace(key, params[key]);
        }, route.dest)
      };
    }
  }
  return null;
}

function resolveBuildFile(dir: string, src: string) {
  const info = path.parse(src);
  // TODO: check if extension is supported
  return path.resolve(dir, `${info.name}.js`);
}

export function matchBuild(
  cwd: string,
  builds: BuildConfig[],
  relReqFilePath: string
): BuildConfig | null {
  for (const build of builds) {
    const reqFilePath = path.resolve(cwd, relReqFilePath);
    const buildFilePath = resolveBuildFile(path.resolve(cwd, build.dir), build.src);
    if (reqFilePath === buildFilePath) {
      return build;
    }
  }
  return null;
}

export async function appHandler(
  cwd: string,
  config: Config,
  req: IncomingMessage,
  res: ServerResponse
) {
  const match = matchRoute(config.routes || [], req.url || "/");

  if (!match) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end(`Not found: ${req.url}`);
    return;
  }

  const build = matchBuild(cwd, config.builds || [], match.path);

  if ((build && build.target === "browser") || !build) {
    const staticFile = path.resolve(cwd, match.path);
    const mimeType = mimeTypes.lookup(staticFile);
    const buf = await readFile(staticFile);

    res.writeHead(200, { "Content-Type": mimeType || "text/plain" });
    res.end(buf);

    return;
  } else if (build && build.target === "server") {
    const serverFile = resolveBuildFile(path.resolve(cwd, build.dir), match.path);

    require(serverFile)(req, {
      end(body: string) {
        return res.end(
          String(body).replace("</body>", '<script src="/__work__/reload.js"></script></body>')
        );
      },
      __proto__: res
    });
    return;
  } else if (build) {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end(`Unknown build target: ${build.target}`);
    return;
  }

  res.writeHead(404, { "content-type": "text/plain" });
  res.end(`Not found: ${req.url}`);
}
