import { baseParse } from 'compiler-core/parse';
import { NodeTypes } from 'compiler-core/ast';

describe('Parse', () => {
  describe('interpolation', () => {
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
});
