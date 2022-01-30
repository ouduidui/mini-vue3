import {
  createRoot,
  ElementNode,
  ElementTypes,
  InterpolationNode,
  NodeTypes,
  RootNode,
  TemplateChildNode,
  TextNode
} from 'compiler-core/ast';
import { isArray } from 'shared/index';

// 默认配置
export const defaultParserOptions = {
  delimiters: [`{{`, `}}`] // 插值分隔符
};

export const enum TextModes {
  //               | Elements | Entities | End sign              | Inside of
  DATA, //    | ✔        | ✔        | End tags of ancestors |
  RCDATA, //  | ✘        | ✔        | End tag of the parent | <textarea>
  RAWTEXT, // | ✘        | ✘        | End tag of the parent | <style>,<script>
  CDATA,
  ATTRIBUTE_VALUE
}

export interface ParserContext {
  options: any;
  source: string;
}

/**
 * 核心函数，解析模板字符串
 * @param content
 */
export function baseParse(content: string): RootNode {
  const context = createParserContext(content); // 创建一个解析上下文
  // 创建一个根AST
  return createRoot(parseChildren(context, []) /* 解析孩子内容 */);
}

/**
 * 初始化配置
 * @param content
 */
function createParserContext(content: string): ParserContext {
  // 初始化配置
  const options = defaultParserOptions;
  return {
    options,
    source: content // 将模板字符串保存在source里
  };
}

/**
 * 解析孩子模板内容
 * @param context
 * @param ancestors
 */
function parseChildren(context: ParserContext, ancestors: ElementNode[]): TemplateChildNode[] {
  // 初始化节点容器
  const nodes: TemplateChildNode[] = [];

  // 遍历模板模板内容（每解析完一部分内容，就会将其在source中删除）
  while (!isEnd(context, ancestors)) {
    // 获取剩余的模板字符串
    const s = context.source;
    // 初始化节点
    let node: TemplateChildNode | TemplateChildNode[] | undefined = undefined;

    if (startsWith(s, context.options.delimiters[0])) {
      // 插值节点
      node = parseInterpolation(context);
    } else if (s[0] === '<') {
      // 解析元素节点
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors);
      }
    }

    if (!node) {
      node = parseText(context);
    }

    // 将这部分解析完的节点插入容器中
    if (isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        nodes.push(node[i]);
      }
    } else {
      nodes.push(node!);
    }
  }

  return nodes;
}

/**
 * 解析插值
 * @param context
 */
function parseInterpolation(context: ParserContext): InterpolationNode | undefined {
  // open -> '{{'   close -> '}}'
  const [open, close] = context.options.delimiters;
  // 获取插值结束下标
  const closeIndex = context.source.indexOf(close, open.length);
  // 没有插值情况
  if (closeIndex === -1) return undefined;

  // 先删除左分隔符
  advanceBy(context, open.length);
  // 获取内容长度，包括空格
  const rawContentLength = closeIndex - open.length;
  // 获取内容
  const rawContent = context.source.slice(0, rawContentLength);
  // 去除空格
  const content = rawContent.trim();
  // 删除剩余部分内容
  advanceBy(context, rawContentLength + close.length);

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content
    }
  };
}

/**
 * 解析元素节点
 * @param context
 * @param ancestors
 */
function parseElement(context: ParserContext, ancestors: ElementNode[]): ElementNode | undefined {
  // 解析开始标签
  const element = parseTag(context, TagType.Start)!;

  // 如果是单标签（自闭合），直接返回
  if (element.isSelfClosing) {
    return element;
  }
  // 递归解析孩子标签
  ancestors.push(element);
  element.children = parseChildren(context, ancestors);
  ancestors.pop();

  // 解析闭合标签
  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End);
  }

  return element;
}

// 标签类型
const enum TagType {
  Start,
  End
}

/**
 * 解析标签
 * @param context
 * @param type
 */
function parseTag(context: ParserContext, type: TagType): ElementNode | undefined {
  // 正则识别
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source)!;
  const tag = match[1];

  // 删除标签文本
  advanceBy(context, match[0].length);

  // TODO 解析属性
  let props = [];

  // 判断是否为单标签（自闭合）
  let isSelfClosing = startsWith(context.source, '/>');
  advanceBy(context, isSelfClosing ? 2 : 1);

  // 如果是结束标签，无需返回节点
  if (type === TagType.End) {
    return;
  }

  // TODO 判断标签类型
  let tagType = ElementTypes.ELEMENT;

  return {
    type: NodeTypes.ELEMENT,
    tag,
    tagType,
    props,
    isSelfClosing,
    children: []
  };
}

/**
 * 解析文本
 * @param context
 */
function parseText(context: ParserContext): TextNode {
  // 解析到'<'或'{{'
  const endTokens = ['<', context.options.delimiters[0]];

  let endIndex = context.source.length;
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i], 1);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }

  // 解析出文本
  const content = context.source.slice(0, endIndex);
  // 删除原文本
  advanceBy(context, endIndex);

  return {
    type: NodeTypes.TEXT,
    content
  };
}

function startsWith(source: string, searchString: string): boolean {
  return source.startsWith(searchString);
}

/**
 * 删除已经解析的字符串
 * @param context
 * @param numberOfCharacters
 */
function advanceBy(context: ParserContext, numberOfCharacters: number): void {
  const { source } = context;
  context.source = source.slice(numberOfCharacters);
}

/**
 * 判断是否解析结束
 * @param context
 * @param ancestors
 */
function isEnd(context: ParserContext, ancestors: ElementNode[]): boolean {
  const s = context.source;

  // 遍历祖先标签，判断是否有未闭合标签
  if (startsWith(s, '</')) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      if (startsWithEndTagOpen(s, ancestors[i].tag)) {
        return true;
      }
    }
  }

  return !s;
}

/**
 * 结束标签
 * @param source
 * @param tag
 */
function startsWithEndTagOpen(source: string, tag: string): boolean {
  return (
    startsWith(source, '</') &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase() &&
    /[\t\r\n\f />]/.test(source[2 + tag.length] || '>')
  );
}
