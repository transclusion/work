"use strict";

const path = require("path");
const request = require("superagent");
const work = require("../src");

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createLogger() {
  return { error: jest.fn(), info: jest.fn() };
}

// function createLogger() {
//   return { error: console.error, info: console.log };
// }

describe("@transclusion/work.dev", () => {
  it("should serve basic app", done => {
    const logger = createLogger();
    const cwd = path.resolve(__dirname, "fixtures/basic");
    const port = 8081;
    const ctx = work.dev({ cwd, logger, port });
    ctx.listen(async close => {
      await delay(500);
      const res = await request.get(`http://localhost:${port}/browser.js`);
      await delay(500);
      close();
      expect(res.body.toString()).toContain(`console.log("browser")`);
      expect(logger.error.mock.calls).toEqual([]);
      expect(logger.info.mock.calls).toEqual([
        [`Listening at http://localhost:${port}`],
        ["GET", "/browser.js"]
      ]);
      done();
    });
  });

  it("should serve react app", done => {
    const logger = createLogger();
    const cwd = path.resolve(__dirname, "fixtures/react");
    const port = 8082;
    const ctx = work.dev({ cwd, logger, port });
    ctx.listen(async close => {
      await delay(500);
      const res = await request.get(`http://localhost:${8082}/`);
      await delay(500);
      close();
      expect(res.text).toContain(`<div data-reactroot="">App</div>`);
      expect(logger.error.mock.calls).toEqual([]);
      expect(logger.info.mock.calls).toEqual([
        [`Listening at http://localhost:${8082}`],
        ["GET", "/"]
      ]);
      done();
    });
  });

  it("should serve babel app", done => {
    const logger = createLogger();
    const cwd = path.resolve(__dirname, "fixtures/babel");
    const port = 8083;
    const ctx = work.dev({ cwd, logger, port });
    ctx.listen(async close => {
      await delay(500);
      const res = await request.get(`http://localhost:${port}/`);
      await delay(500);
      close();
      expect(res.text).toContain(`<div id="root">Hello, Foo!</div>`);
      expect(logger.error.mock.calls).toEqual([]);
      expect(logger.info.mock.calls).toEqual([
        [`Listening at http://localhost:${port}`],
        ["GET", "/"]
      ]);
      done();
    });
  });

  it("should serve now-compat app", done => {
    const logger = createLogger();
    const cwd = path.resolve(__dirname, "fixtures/now-compat");
    const port = 8084;
    const ctx = work.dev({ cwd, logger, port });
    ctx.listen(async close => {
      await delay(500);
      const res = await request.get(`http://localhost:${port}/static/browser.js`);
      await delay(500);
      close();
      expect(res.body.toString()).toContain(`console.log("browser");`);
      expect(logger.error.mock.calls).toEqual([]);
      expect(logger.info.mock.calls).toEqual([
        [`Listening at http://localhost:${port}`],
        ["GET", "/static/browser.js"]
      ]);
      done();
    });
  });
});
