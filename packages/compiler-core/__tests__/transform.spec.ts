import type { TemplateNode, TextNode } from 'compiler-core/ast'
import { NodeTypes } from 'compiler-core/ast'
import { baseParse } from 'compiler-core/parse'
import { transform } from 'compiler-core/transform'

describe('transform', () => {
  it('happy path', () => {
    const ast = baseParse('<div>Hello {{message}}</div>')
    const plugin = (node) => {
      if (node.type === NodeTypes.TEXT)
        node.content += 'World'
    }
    transform(ast, {
      nodeTransforms: [plugin],
    })

    const nodeText = (ast.children[0] as TemplateNode).children[0] as TextNode
    expect(nodeText.content).toBe('Hello World')
  })
})

describe('codegenNode', () => {
  it('string', () => {
    const ast = baseParse('HelloWorld')
    transform(ast, {})
    expect(ast.codegenNode).toStrictEqual({
      content: 'HelloWorld',
      type: 2,
    })
  })

  it('interpolation', () => {
    const ast = baseParse('<div>Hello {{message}}</div>')
    transform(ast, {})
    expect(ast.codegenNode).toStrictEqual({
      children: [
        {
          content: 'Hello ',
          type: 2,
        },
        {
          content: {
            content: 'message',
            type: 4,
          },
          type: 5,
        },
      ],
      isSelfClosing: false,
      props: [],
      tag: 'div',
      tagType: 0,
      type: 1,
      codegenNode: undefined,
    })
  })
})
