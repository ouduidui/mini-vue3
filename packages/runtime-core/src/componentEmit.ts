import { camelize, toHandlerKey } from 'shared/index'
import type { ComponentInternalInstance } from './component'

export type EmitFn = (event: string, ...args: any[]) => void

export function emit(instance: ComponentInternalInstance, event: string, ...rawArgs: any[]) {
  const { props } = instance

  let handlerName
  const handler = props[(handlerName = toHandlerKey(event))] || props[(handlerName = toHandlerKey(camelize(event)))]

  if (handler && typeof handler === 'function')
    handler && handler(...rawArgs)
}
