'use strict'

module.exports = {
  env: {
    browser: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {browsers: ['>0.25%', 'not ie 11', 'not op_mini all']}
          }
        ]
      ],
      plugins: [['@babel/plugin-transform-runtime', {helpers: true, regenerator: true}]]
    },
    server: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {node: 'current'}
          }
        ]
      ]
    }
  }
}
