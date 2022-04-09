import type { NodeTransform } from './transform'

export interface TransformOptions {
  nodeTransforms?: NodeTransform[]
}

export interface CodegenOptions {}

export interface ParserOptions {
  isNativeTag?: (tag: string) => boolean
  delimiters?: [string, string]
}

export type CompilerOptions = ParserOptions & TransformOptions & CodegenOptions
