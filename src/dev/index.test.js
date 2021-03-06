'use strict'

const path = require('path')
const request = require('superagent')
const work = require('..')

function fixturePath(name) {
  return path.resolve(__dirname, '../../test/fixtures', name)
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function createLogger() {
  return {error: jest.fn(), info: jest.fn()}
}

describe('dev', () => {
  it('should serve basic app', done => {
    const logger = createLogger()
    const cwd = fixturePath('basic')
    const ctx = work.dev({cwd, logger})
    ctx.listen(async ctx => {
      expect(ctx.servers.length).toBe(1)
      const port = ctx.servers[0].port
      await delay(500)
      const res = await request.get(`http://localhost:${port}/browser.js`)
      await delay(500)
      ctx.close()
      expect(res.body.toString()).toContain(`console.log("browser")`)
      expect(logger.error.mock.calls).toEqual([])
      expect(logger.info.mock.calls).toEqual([
        [`Listening at http://localhost:${port}`],
        ['GET', '/browser.js']
      ])
      done()
    })
  })

  it('should serve react app', done => {
    const logger = createLogger()
    const cwd = fixturePath('react')
    const ctx = work.dev({cwd, logger})
    ctx.listen(async ctx => {
      expect(ctx.servers.length).toBe(1)
      const port = ctx.servers[0].port
      await delay(500)
      const res = await request.get(`http://localhost:${port}/`)
      await delay(500)
      ctx.close()
      expect(res.text).toContain(`<div data-reactroot="">App</div>`)
      expect(logger.error.mock.calls).toEqual([])
      expect(logger.info.mock.calls).toEqual([
        [`Listening at http://localhost:${port}`],
        ['GET', '/']
      ])
      done()
    })
  })

  it('should serve babel app', done => {
    const logger = createLogger()
    const cwd = fixturePath('babel')
    const ctx = work.dev({cwd, logger})
    ctx.listen(async ctx => {
      expect(ctx.servers.length).toBe(1)
      const port = ctx.servers[0].port
      await delay(500)
      const res = await request.get(`http://localhost:${port}/`)
      await delay(500)
      ctx.close()
      expect(res.text).toContain(`<div id="root">Hello, Foo!</div>`)
      expect(logger.error.mock.calls).toEqual([])
      expect(logger.info.mock.calls).toEqual([
        [`Listening at http://localhost:${port}`],
        ['GET', '/']
      ])
      done()
    })
  })

  it('should serve babel+typescript app', done => {
    const logger = createLogger()
    const cwd = fixturePath('babel-ts')
    const ctx = work.dev({cwd, logger})
    ctx.listen(async ctx => {
      expect(ctx.servers.length).toBe(1)
      const port = ctx.servers[0].port
      await delay(500)
      const res = await request.get(`http://localhost:${port}/`)
      await delay(500)
      ctx.close()
      expect(res.text).toContain(`<div id="root">Hello, Foo!</div>`)
      expect(logger.error.mock.calls).toEqual([])
      expect(logger.info.mock.calls).toEqual([
        [`Listening at http://localhost:${port}`],
        ['GET', '/']
      ])
      done()
    })
  })

  it('should serve now-compat app', done => {
    const logger = createLogger()
    const cwd = fixturePath('now-compat')
    const ctx = work.dev({cwd, logger})
    ctx.listen(async ctx => {
      expect(ctx.servers.length).toBe(1)
      const port = ctx.servers[0].port
      await delay(500)
      const res = await request.get(`http://localhost:${port}/static/browser.js`)
      await delay(500)
      ctx.close()
      expect(res.body.toString()).toContain(`console.log("browser");`)
      expect(logger.error.mock.calls).toEqual([])
      expect(logger.info.mock.calls).toEqual([
        [`Listening at http://localhost:${port}`],
        ['GET', '/static/browser.js']
      ])
      done()
    })
  })

  it('should serve multi-config app', done => {
    const logger = createLogger()
    const cwd = fixturePath('multi-config')
    const ctx = work.dev({cwd, logger})
    ctx.listen(async ctx => {
      expect(ctx.servers.length).toBe(2)
      const port1 = ctx.servers[0].port
      const port2 = ctx.servers[1].port
      await delay(500)
      const res1 = await request.get(`http://localhost:${port1}/`)
      const res2 = await request.get(`http://localhost:${port2}/`)
      await delay(500)
      ctx.close()
      expect(res1.text).toBe('server1')
      expect(res2.text).toBe('server2')
      done()
    })
  })

  it('should serve', done => {
    const logger = createLogger()
    const cwd = fixturePath('server')
    const ctx = work.dev({cwd, logger})
    ctx.listen(async ctx => {
      expect(ctx.servers.length).toBe(1)
      const port = ctx.servers[0].port
      await delay(500)
      const res = await request.get(`http://localhost:${port}/`)
      await delay(500)
      ctx.close()
      expect(res.text).toBe(`Created`)
      expect(logger.error.mock.calls).toEqual([])
      expect(logger.info.mock.calls).toEqual([
        [`Listening at http://localhost:${port}`],
        ['GET', '/']
      ])
      done()
    })
  })
})
