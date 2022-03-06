import { RootNode } from './ast';
import { baseParse } from './parse';
import { isString } from 'shared/index';
import { transform } from './transform';
import { generate } from './codegen';

export function baseCompile(template: string | RootNode, options: any) {
  // 先将template转成AST语法树
  const ast = isString(template) ? baseParse(template, options) : template;
  transform(ast, {});

  return generate(ast, {});
}
