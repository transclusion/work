import fs from 'fs'
import path from 'path'
import pkgUp from 'pkg-up'
import {promisify} from 'util'

const readFile = promisify(fs.readFile)

function fileExists(filePath: string) {
  return new Promise(resolve => {
    fs.access(filePath, 0, err => {
      if (err) {
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

export async function detectBabel(opts: {cwd: string}) {
  const pkgPath = await pkgUp({cwd: opts.cwd})

  if (!pkgPath) {
    throw new Error('could not locate package.json')
  }

  const projectPath = path.dirname(pkgPath)

  // .babelrc
  const babelRcExists = await fileExists(path.resolve(projectPath, '.babelrc'))
  if (babelRcExists) {
    return true
  }

  // .babelrc.js
  const babelRcJsExists = await fileExists(path.resolve(projectPath, '.babelrc.js'))
  if (babelRcJsExists) {
    return true
  }

  // babel.config.js
  const babelConfigJsExists = await fileExists(path.resolve(projectPath, 'babel.config.js'))
  if (babelConfigJsExists) {
    return true
  }

  // package.json with "babel" property
  const pkgBuf = await readFile(pkgPath)
  const pkg = JSON.parse(pkgBuf.toString())
  if (pkg.babel) {
    return true
  }

  return false
}
