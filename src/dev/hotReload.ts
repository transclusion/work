import {ServerResponse} from 'http'
import {Middleware} from '../types'
import {HotReload} from './types'

const HOT_RELOAD_EVENTS_ENDPOINT = '/__hotreload__/events'
const HOT_RELOAD_SCRIPT_ENDPOINT = '/__hotreload__/reload.js'
const HOT_RELOAD_SCRIPT = `;(function() {
  'use strict'
  var es = new EventSource('${HOT_RELOAD_EVENTS_ENDPOINT}')
  es.addEventListener('browser', function(evt) {
    var msg = JSON.parse(evt.data)
    if (msg.code === 'rollup.BUNDLE_END') window.location.reload()
  })
  es.addEventListener('server', function(evt) {
    var msg = JSON.parse(evt.data)
    if (msg.code === 'rollup.BUNDLE_END') window.location.reload()
    if (msg.code === 'rollup.ERROR') displayError(msg.error)
  })
  function displayError(error) {
    var errorElement = document.getElementById('__work_error')
    if (!errorElement) {
      errorElement = document.createElement('pre')
      errorElement.id = '__work_error'
      errorElement.style.position = 'absolute'
      errorElement.style.top = '0'
      errorElement.style.left = '0'
      errorElement.style.width = '100%'
      errorElement.style.height = '100%'
      errorElement.style.overflow = 'auto'
      errorElement.style.background = '#fdd'
      errorElement.style.margin = '0'
      errorElement.style.padding = '16px'
      errorElement.style.font = '14px/20px SF Mono,Menlo,monospace'
      errorElement.style.boxSizing = 'border-box'
      document.body.appendChild(errorElement)
    }
    errorElement.innerHTML = error.stack
  }
})()`

export function hotReload(): HotReload {
  const sockets: any[] = []

  const addSocket = (socket: ServerResponse) => {
    socket.writeHead(200, {
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream'
    })
    socket.write('\n')
    sockets.push(socket)
  }

  const middleware: Middleware = (req, res, next) => {
    if (req.url === HOT_RELOAD_SCRIPT_ENDPOINT) {
      res.end(HOT_RELOAD_SCRIPT)
      return
    } else if (req.url === HOT_RELOAD_EVENTS_ENDPOINT) {
      addSocket(res)
      req.on('close', () => removeSocket(res))
      return
    } else {
      return next()
    }
  }

  const removeSocket = (socket: any) => {
    const idx = sockets.indexOf(socket)
    if (idx > -1) {
      sockets.splice(idx, 1)
    }
  }

  const postMessage = (type: string, msg: any) => {
    sockets.forEach(socket => {
      socket.write(`event: ${type}\n`)
      socket.write(`data: ${JSON.stringify(msg)}\n\n`)
    })
  }

  return {middleware, postMessage}
}
