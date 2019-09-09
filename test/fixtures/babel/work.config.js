"use strict";

module.exports = {
  browser: {
    input: ["./browser.js"]
  },
  server: {
    routes: {
      "/": "./server.js"
    }
  }
};
