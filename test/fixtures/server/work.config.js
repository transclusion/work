'use strict'

module.exports = {
  builds: [{src: './server', target: 'server', dir: './dist'}],
  routes: [{src: '/(.*)', dest: './dist/server.js'}]
}
