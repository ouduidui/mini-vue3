import { transform } from 'compiler-core/transform'
import { generate } from 'compiler-core/codegen'
import { baseParse } from 'compiler-core/parse'
import { transformExpression } from 'compiler-core/transform/transformExpression'

describe('codegen', () => {
  it('string', () => {
    const ast = baseParse('helloworld')
    transform(ast, {
      nodeTransforms: [],
    })
    const { code } = generate(ast)
    expect(code).toMatchSnapshot()
  })

  it('interpolation', () => {
    const ast = baseParse('{{message}}')
    transform(ast, {
      nodeTransforms: [transformExpression],
    })
    const { code } = generate(ast)
    expect(code).toMatchSnapshot()
  })
})
