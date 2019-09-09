"use strict";

module.exports = {
  server: {
    routes: {
      "/": "server.js"
    }
  },
  plugins: ["./plugins/custom-react"]
};
