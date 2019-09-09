"use strict";

module.exports = {
  builds: [{ src: "./browser", target: "browser", dir: "./dist" }],
  routes: [{ src: "/browser.js", dest: "./dist/browser.js" }]
};
