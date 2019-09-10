#!/usr/bin/env node

import chalk from 'chalk'
import {argv} from 'yargs'
import build from './build'
import dev from './dev'
import start from './start'
import {Logger} from './types'

const VERSION = '1.0.0-alpha.0'
const {_: args, ...rest} = argv
const {$0: script, ...params} = rest

const logger: Logger = {
  error(...printArgs: any[]) {
    // tslint:disable-next-line no-console
    console.error(chalk.red('work'), ...printArgs)
  },
  info(...printArgs: any[]) {
    // tslint:disable-next-line no-console
    console.log(chalk.cyan('work'), ...printArgs)
  }
}

if (args[0] === 'build') {
  try {
    build({
      cwd: process.cwd(),
      logger
    }).catch((err: any) => {
      logger.error(err.stack)
      process.exit(1)
    })
  } catch (err) {
    logger.error(err.stack)
    process.exit(1)
  }
} else if (args[0] === 'dev') {
  try {
    dev({
      cwd: process.cwd(),
      logger,
      port: (params.p || params.port) as any
    }).listen()
  } catch (err) {
    logger.error(err.stack)
    process.exit(1)
  }
} else if (args[0] === 'start') {
  start({
    cwd: process.cwd(),
    logger,
    port: (params.p || params.port) as any
  }).catch((err: any) => {
    logger.error(err.stack)
    process.exit(1)
  })
} else {
  if (args[0]) {
    logger.error(chalk.red(`unknown command: ${args[0]}`))
    process.exit(1)
  } else if (params.v || params.version) {
    // tslint:disable-next-line no-console
    console.log(VERSION)
  } else {
    printUsage()
  }
}

function printUsage() {
  // tslint:disable-next-line no-console
  console.log(`usage: work [-v|--version] <command>

Commands:
  build  Builds the application to the \`dist\` directory
  dev    Runs the development server
  start  Starts the production server`)
}
