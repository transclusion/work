"use strict";

module.exports = {
  builds: [
    { src: "./browser.js", target: "browser", dir: "./dist" },
    { src: "./server.js", target: "server", dir: "./dist" }
  ],
  routes: [
    { src: "/browser.js", dest: "./dist/browser.js" },
    { src: "/", dest: "./dist/server.js" }
  ],
  extendRollup(rollupOpts, buildConfig) {
    const babel = { ...rollupOpts.babel, runtimeHelpers: true };
    return {
      ...rollupOpts,
      babel
    };
  }
};
