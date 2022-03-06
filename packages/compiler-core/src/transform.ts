import { RootNode, TemplateChildNode } from './ast';

type TransformOptions = any;

function createTransformContext(root: RootNode, {}: TransformOptions) {
  const context = {};
  return context;
}

export function transform(root: RootNode, options: TransformOptions) {
  const context = createTransformContext(root, options);
  traverseNode(root, context);
}

function traverseNode(root: RootNode | TemplateChildNode, options: TransformOptions) {}
