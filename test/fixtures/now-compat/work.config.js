"use strict";

module.exports = {
  builds: [{ src: "./src/browser.js", target: "browser", dir: "./dist/static" }],
  routes: [{ src: "/static/(.*)", dest: "./dist/static/$1" }]
};
