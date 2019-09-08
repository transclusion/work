#!/usr/bin/env node

import chalk from "chalk";
import { argv } from "yargs";
import build from "./build";
import dev from "./dev";
import start from "./start";
import { Logger } from "./types";

const VERSION = "1.0.0-alpha.0";

const { _: args, ...rest } = argv;
const { $0: script, ...params } = rest;

const logger: Logger = {
  error(...args) {
    console.error(chalk.red("work"), ...args);
  },
  info(...args) {
    console.log(chalk.cyan("work"), ...args);
  }
};

if (args[0] === "build") {
  // console.log("build", params);

  require("@babel/register")({
    extensions: [".ts", ".tsx", ".es6", ".es", ".jsx", ".js", ".mjs"],
    root: process.cwd(),
    presets: [
      require.resolve("@babel/preset-typescript"),
      require.resolve("@babel/preset-env"),
      require.resolve("@babel/preset-react")
    ]
  });

  try {
    logger.info("building...");
    console.time("build time");
    build({
      cwd: process.cwd(),
      logger
    })
      .then(() => {
        console.timeEnd("build time");
      })
      .catch((err: any) => {
        console.error(chalk.red(`Error: ${err.stack}`));
        process.exit(1);
      });
  } catch (err) {
    console.error(chalk.red(`Error: ${err.stack}`));
    process.exit(1);
  }
} else if (args[0] === "dev") {
  // console.log("dev", params);

  require("@babel/register")({
    extensions: [".ts", ".tsx", ".es6", ".es", ".jsx", ".js", ".mjs"],
    root: process.cwd(),
    presets: [
      require.resolve("@babel/preset-typescript"),
      require.resolve("@babel/preset-env"),
      require.resolve("@babel/preset-react")
    ]
  });

  try {
    const ctx = dev({
      cwd: process.cwd(),
      logger
    });

    ctx.listen();
  } catch (err) {
    console.error(chalk.red(`Error: ${err.stack}`));
    process.exit(1);
  }
} else if (args[0] === "start") {
  logger.info("starting...");
  console.time("start time");
  start({
    cwd: process.cwd(),
    logger
  })
    .then(() => {
      console.timeEnd("start time");
    })
    .catch((err: any) => {
      console.error(chalk.red(`Error: ${err.stack}`));
      process.exit(1);
    });
} else {
  if (args[0]) {
    console.error(chalk.red(`unknown command: ${args[0]}`));
    process.exit(1);
  } else if (params.v || params.version) {
    console.log(VERSION);
  } else {
    printUsage();
  }
}

function printUsage() {
  console.log(`usage: work [-v|--version] <command>

Commands:
  build  Builds the application to the \`dist\` directory
  dev    Runs the development server
  start  Starts the production server`);
}
