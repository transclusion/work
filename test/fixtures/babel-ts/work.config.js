'use strict'

module.exports = {
  builds: [
    {src: './browser.ts', target: 'browser', dir: './dist'},
    {src: './server.ts', target: 'server', dir: './dist'}
  ],
  routes: [{src: '/browser.js', dest: './dist/browser.js'}, {src: '/', dest: './dist/server.js'}],
  extendRollup(rollupOpts, buildConfig) {
    const babel = {...rollupOpts.babel, runtimeHelpers: true}
    return {
      ...rollupOpts,
      babel
    }
  }
}
