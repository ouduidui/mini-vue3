import { createRenderer } from 'runtime-core/index'
import { extend } from 'shared/index'

import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'

const rendererOptions = extend({ patchProp }, nodeOps)

const renderer = createRenderer(rendererOptions)

export const createApp = (...args) => renderer.createApp(...args)

export * from 'runtime-core/index'
