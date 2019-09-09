"use strict";

module.exports = {
  extendRollup: rollupOpts => {
    const external = rollupOpts.external.concat(["stream"]);
    const commonjs = {
      ...rollupOpts.commonjs,
      namedExports: {
        ...rollupOpts.commonjs.namedExports,
        "node_modules/react/index.js": [
          "Component",
          "cloneElement",
          "createContext",
          "createElement",
          "useState"
        ],
        "node_modules/react-dom/index.js": ["hydrate"],
        "node_modules/react-dom/server.js": ["renderToString"],
        "node_modules/react-is/index.js": ["ForwardRef", "isElement", "isValidElementType"]
      }
    };

    return {
      ...rollupOpts,
      external,
      commonjs
    };
  }
};
