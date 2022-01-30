import { baseParse } from 'compiler-core/parse';
import { ElementTypes, NodeTypes } from 'compiler-core/ast';

describe('Parse', () => {
  describe('Text', () => {
    it('simple text', () => {
      const ast = baseParse('some text');
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.TEXT,
        content: 'some text'
      });
    });
  });

  describe('Interpolation', () => {
    it('simple interpolation', () => {
      const ast = baseParse('{{ message }}');
      // root
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'message'
        }
      });
    });
  });

  describe('Element', () => {
    it('simple div', () => {
      const ast = baseParse('<div>HelloWorld</div>');
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: 'div',
        isSelfClosing: false,
        tagType: ElementTypes.ELEMENT,
        props: [],
        children: [
          {
            type: NodeTypes.TEXT,
            content: 'HelloWorld'
          }
        ]
      });
    });

    it('empty', () => {
      const ast = baseParse('<div></div>');
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: 'div',
        isSelfClosing: false,
        tagType: ElementTypes.ELEMENT,
        props: [],
        children: []
      });
    });

    it('self closing', () => {
      const ast = baseParse('<div/>after');
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: 'div',
        isSelfClosing: true,
        tagType: ElementTypes.ELEMENT,
        props: [],
        children: []
      });
    });
  });
});
