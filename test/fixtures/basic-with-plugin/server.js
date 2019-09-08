import React from "react";
import { renderToString } from "react-dom/server";

function App() {
  return <div>App</div>;
}

export default (req, res) => {
  res.end(renderToString(<App />));
};
