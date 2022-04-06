import { transform } from 'compiler-core/transform'
import { generate } from 'compiler-core/codegen'
import { baseParse } from 'compiler-core/parse'

describe('codegen', () => {
  it('string', () => {
    const ast = baseParse('helloworld')
    transform(ast, {
      nodeTransforms: [],
    })
    const { code } = generate(ast)
    expect(code).toBe('return function render(_ctx, _cache){return "helloworld"}')
  })

  // it('interpolation', () => {
  //   const ast = baseParse('<div>Hello {{message}}</div>')
  //   transform(ast, {
  //     nodeTransforms: [],
  //   })
  //   const { code } = generate(ast)
  //   expect(code).toBe('return function render(_ctx, _cache){return "helloworld"}')
  // })
})
