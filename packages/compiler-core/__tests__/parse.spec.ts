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

    it('attribute with no value', () => {
      const ast = baseParse('<div id></div>');
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: 'div',
        isSelfClosing: false,
        tagType: ElementTypes.ELEMENT,
        props: [
          {
            type: NodeTypes.ATTRIBUTE,
            name: 'id',
            value: undefined
          }
        ],
        children: []
      });
    });

    it('attribute with empty value, double quote', () => {
      const ast = baseParse('<div id=""></div>');

      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: 'div',
        tagType: ElementTypes.ELEMENT,
        props: [
          {
            type: NodeTypes.ATTRIBUTE,
            name: 'id',
            value: {
              type: NodeTypes.TEXT,
              content: ''
            }
          }
        ],

        isSelfClosing: false,
        children: []
      });
    });

    it('attribute with empty value, single quote', () => {
      const ast = baseParse("<div id=''></div>");

      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.ELEMENT,

        tag: 'div',
        tagType: ElementTypes.ELEMENT,
        props: [
          {
            type: NodeTypes.ATTRIBUTE,
            name: 'id',
            value: {
              type: NodeTypes.TEXT,
              content: ''
            }
          }
        ],

        isSelfClosing: false,
        children: []
      });
    });

    it('attribute with value, double quote', () => {
      const ast = baseParse('<div id=">\'"></div>');

      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.ELEMENT,

        tag: 'div',
        tagType: ElementTypes.ELEMENT,

        props: [
          {
            type: NodeTypes.ATTRIBUTE,
            name: 'id',
            value: {
              type: NodeTypes.TEXT,
              content: ">'"
            }
          }
        ],

        isSelfClosing: false,
        children: []
      });
    });

    it('attribute with value, single quote', () => {
      const ast = baseParse("<div id='>\"'></div>");
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: 'div',
        tagType: ElementTypes.ELEMENT,
        props: [
          {
            type: NodeTypes.ATTRIBUTE,
            name: 'id',
            value: {
              type: NodeTypes.TEXT,
              content: '>"'
            }
          }
        ],

        isSelfClosing: false,
        children: []
      });
    });

    it('attribute with value, unquoted', () => {
      const ast = baseParse('<div id=a/></div>');

      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: 'div',
        tagType: ElementTypes.ELEMENT,
        props: [
          {
            type: NodeTypes.ATTRIBUTE,
            name: 'id',
            value: {
              type: NodeTypes.TEXT,
              content: 'a/'
            }
          }
        ],

        isSelfClosing: false,
        children: []
      });
    });

    it('multiple attributes', () => {
      const ast = baseParse('<div id=a class="c" inert style=\'\'></div>');

      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: 'div',
        tagType: ElementTypes.ELEMENT,
        props: [
          {
            type: NodeTypes.ATTRIBUTE,
            name: 'id',
            value: {
              type: NodeTypes.TEXT,
              content: 'a'
            }
          },
          {
            type: NodeTypes.ATTRIBUTE,
            name: 'class',
            value: {
              type: NodeTypes.TEXT,
              content: 'c'
            }
          },
          {
            type: NodeTypes.ATTRIBUTE,
            name: 'inert',
            value: undefined
          },
          {
            type: NodeTypes.ATTRIBUTE,
            name: 'style',
            value: {
              type: NodeTypes.TEXT,
              content: ''
            }
          }
        ],

        isSelfClosing: false,
        children: []
      });
    });

    it('template element', () => {
      const ast = baseParse('<template></template>');
      expect(ast.children[0]).toMatchObject({
        type: NodeTypes.ELEMENT,
        tag: 'template',
        tagType: ElementTypes.TEMPLATE
      });
    });

    it('native element with `isNativeTag`', () => {
      const ast = baseParse('<div></div><comp></comp><Comp></Comp>', {
        isNativeTag: (tag) => tag === 'div'
      });

      expect(ast.children[0]).toMatchObject({
        type: NodeTypes.ELEMENT,
        tag: 'div',
        tagType: ElementTypes.ELEMENT
      });

      expect(ast.children[1]).toMatchObject({
        type: NodeTypes.ELEMENT,
        tag: 'comp',
        tagType: ElementTypes.COMPONENT
      });

      expect(ast.children[2]).toMatchObject({
        type: NodeTypes.ELEMENT,
        tag: 'Comp',
        tagType: ElementTypes.COMPONENT
      });
    });
  });
});
