import {IncomingMessage, ServerResponse} from 'http'

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function load() {
  await delay(100)
  return {name: 'Foo'}
}

export default async (_: IncomingMessage, res: ServerResponse) => {
  const data = await load()
  res.end(`<div id="root">Hello, ${data.name}!</div>
<script src="/browser.js"></script>`)
}
