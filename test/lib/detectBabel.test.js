'use strict'

const path = require('path')
const {detectBabel} = require('../../src/lib/detectBabel')

describe('detectBabel', () => {
  it('should detect repo without babel config', async () => {
    const cwd = path.resolve(__dirname, 'fixtures/without-babel')
    const isBabelRepo = await detectBabel({cwd})
    expect(isBabelRepo).toBe(false)
  })

  it('should detect repo with .babelrc', async () => {
    const cwd = path.resolve(__dirname, 'fixtures/with-dot-babelrc')
    const isBabelRepo = await detectBabel({cwd})
    expect(isBabelRepo).toBe(true)
  })

  it('should detect repo with .babelrc.js', async () => {
    const cwd = path.resolve(__dirname, 'fixtures/with-dot-babelrc-js')
    const isBabelRepo = await detectBabel({cwd})
    expect(isBabelRepo).toBe(true)
  })

  it('should detect repo with babel.config.js', async () => {
    const cwd = path.resolve(__dirname, 'fixtures/with-babel-config-js')
    const isBabelRepo = await detectBabel({cwd})
    expect(isBabelRepo).toBe(true)
  })

  it('should detect repo with babel.config.js', async () => {
    const cwd = path.resolve(__dirname, 'fixtures/with-babel-config-js')
    const isBabelRepo = await detectBabel({cwd})
    expect(isBabelRepo).toBe(true)
  })

  it('should detect repo with "babel" in package.json', async () => {
    const cwd = path.resolve(__dirname, 'fixtures/with-babel-package-json')
    const isBabelRepo = await detectBabel({cwd})
    expect(isBabelRepo).toBe(true)
  })
})
