import { baseCompile } from 'compiler-core/index'
import type { CompilerOptions } from 'compiler-core/options'
import type { RenderFunction } from 'runtime-core/component'
import { registerRuntimeCompiler } from 'runtime-core/component'
import { isString } from 'shared/index'
import * as runtimeDom from 'runtime-dom/index'

function compileToFunction(
  template: string | HTMLElement,
  options?: CompilerOptions,
): RenderFunction {
  if (!isString(template))
    template = template.innerHTML

  const { code } = baseCompile(template, options)

  // eslint-disable-next-line no-new-func
  const render = new Function('Vue', code)(runtimeDom) as RenderFunction

  return render
}

registerRuntimeCompiler(compileToFunction)

export { compileToFunction as compile }
export * from 'reactivity/index'
export * from 'runtime-dom/index'
