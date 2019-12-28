import {Middleware} from '../types'

export interface HotReload {
  middleware: Middleware
  postMessage: (type: string, msg: any) => void
}
