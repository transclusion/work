import {Middleware} from '../types'

export interface EventSource {
  middleware: Middleware
  send: (type: string, msg: any) => void
}
