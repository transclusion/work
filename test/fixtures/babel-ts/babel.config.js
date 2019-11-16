'use strict'

module.exports = {
  env: {
    browser: {
      presets: [
        '@babel/preset-typescript',
        [
          '@babel/preset-env',
          {
            targets: {
              browsers: ['>0.25%', 'not ie 11', 'not op_mini all']
            }
          }
        ]
      ]
    },
    server: {
      presets: [
        '@babel/preset-typescript',
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current'
            }
          }
        ]
      ]
    }
  }
}
