import { transform } from 'compiler-core/transform'
import { generate } from 'compiler-core/codegen'
import { baseParse } from 'compiler-core/parse'
import { transformExpression } from 'compiler-core/transform/transformExpression'
import { transformElement } from 'compiler-core/transform/transformElement'
import { transformText } from 'compiler-core/transform/transformText'

describe('codegen', () => {
  it('string', () => {
    const ast = baseParse('helloworld')
    transform(ast, {})
    const { code } = generate(ast)
    expect(code).toMatchInlineSnapshot('"return function render(_ctx, _cache){return \\"helloworld\\"}"')
  })

  it('interpolation', () => {
    const ast = baseParse('{{message}}')
    transform(ast, {
      nodeTransforms: [transformExpression],
    })
    const { code } = generate(ast)
    expect(code).toMatchInlineSnapshot(`
"const { toDisplayString: _toDisplayString } = Vue
return function render(_ctx, _cache){return _toDisplayString(_ctx.message)}"
`)
  })

  it('element', () => {
    const ast = baseParse('<div></div>')
    transform(ast, {
      nodeTransforms: [transformElement],
    })
    const { code } = generate(ast)
    expect(code).toMatchInlineSnapshot(`
"const { createElementVNode: _createElementVNode } = Vue
return function render(_ctx, _cache){return _createElementVNode('div',[])}"
`)
  })

  it('complex element', () => {
    const ast = baseParse('<div>Hi, {{message}}</div>')
    transform(ast, {
      nodeTransforms: [transformText, transformElement, transformExpression],
    })

    const { code } = generate(ast)
    expect(code).toMatchInlineSnapshot(`
"const { createElementVNode: _createElementVNode } = Vue
return function render(_ctx, _cache){return _createElementVNode('div',[],[\\"Hi, \\" + _toDisplayString(message)])}"
`)
  })
})
