import React from "react";
import { renderToString } from "react-dom/server";
import { App } from "./app";

export default (req, res) => {
  res.end(`<div id="root">${renderToString(<App />)}</div><script src="/browser.js"></script>`);
};
