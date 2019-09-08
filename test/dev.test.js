"use strict";

const path = require("path");
const request = require("superagent");
const work = require("../src");

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe("@transclusion/work.dev", () => {
  it("should serve basic app", done => {
    const logger = { error: jest.fn(), info: jest.fn() };
    const cwd = path.resolve(__dirname, "fixtures/basic");
    const ctx = work.dev({ cwd, logger });

    ctx.listen(async close => {
      const resClientJs = await request.get("http://localhost:3000/client.js");
      await delay(20);
      close();
      expect(resClientJs.body.toString()).toContain(`console.log("client");`);
      expect(logger.error.mock.calls).toEqual([]);
      expect(logger.info.mock.calls).toEqual([
        ["Listening at http://localhost:3000"],
        ["GET", "/client.js"]
      ]);
      done();
    });
  });

  it("should serve basic app with plugin", done => {
    const logger = { error: jest.fn(), info: jest.fn() };
    const cwd = path.resolve(__dirname, "fixtures/basic-with-plugin");
    const ctx = work.dev({ cwd, logger });

    ctx.listen(async close => {
      const resClientJs = await request.get("http://localhost:3000/");
      await delay(150);
      close();
      expect(resClientJs.text).toBe(`<div data-reactroot="">App</div>`);
      expect(logger.error.mock.calls).toEqual([]);
      expect(logger.info.mock.calls).toEqual([
        ["Listening at http://localhost:3000"],
        ["GET", "/"]
      ]);
      done();
    });
  });
});
