# work

**_It just works_ so you can stop configuring and get s\*\*t done!**

> NOTE: `@transclusion/work` is currently in alpha.

## What is this?

`@transclusion/work` is a runtime that provides a **highly opinionated environment for quickly developing web apps** with Node.js. Becauce it’s built on top of `micro`, it works particularly well with the `now` platform.

## What does it do?

- **Understanding** both modern JavaScript and TypeScript (with no configuration). Since it uses `rollup` under the hood, the bundles are as small and optimized and possible.
- Running a **development server** with hot-reloading.
- Running a **production server** with highly optimized configuration.

## Get started

First install `work`:

```sh
npm install @transclusion/work
```

Create a file called `work.config.js` in the root of the project:

```js
module.exports = {
  builds: [
    {src: './browser.js', target: 'browser', dir: './dist/static'},
    {src: './server.js', target: 'server', dir: './dist'}
  ],
  routes: [
    { src: '/static/(.*)', dest: './dist/static/$1' },
    { src: '(.*)', dest: './dist/server.js' }
  ],
  extendRollup(rollupConfig) {
    // extend rollup config if needed
    return {...rollupConfig}
  }
}
```

Run the development server:

```sh
npx work dev
# Listening at http://localhost:3000
```
