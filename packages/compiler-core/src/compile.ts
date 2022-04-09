import { isString } from 'shared/index'
import type { RootNode } from './ast'
import { baseParse } from './parse'
import { transform } from './transform'
import type { CodegenResult } from './codegen'
import { generate } from './codegen'
import { transformText } from './transform/transformText'
import { transformElement } from './transform/transformElement'
import { transformExpression } from './transform/transformExpression'
import type { CompilerOptions } from './options'

export function baseCompile(
  template: string | RootNode,
  options: CompilerOptions = {},
): CodegenResult {
  const ast = isString(template) ? baseParse(template, options) : template
  transform(ast, {
    nodeTransforms: [transformExpression, transformElement, transformText],
  })
  return generate(ast)
}
