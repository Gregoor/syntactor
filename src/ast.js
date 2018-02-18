// @flow
import {BINARY_OPERATORS, LOGICAL_OPERATORS, UNARY_OPERATORS, UPDATE_OPERATORS} from 'babel-types';

type ASTNode = {|
  fields?: {
    [name: string]: {|
      type?: string | any[],
      values?: any[],
      each?: string | string[],
      default?: any,
      optional?: true,
    |}
  },
  visitor?: string[],
  aliases?: string[],
  inherits?: string,
  deprecatedAlias?: string
|}

const functionCommon = {
  params: {
    type: 'array',
    each: 'LVal',
  },
  generator: {
    type: 'boolean',
    default: false,
  },
  async: {
    type: 'boolean',
    default: false,
  },
};

const functionTypeAnnotationCommon = {
  returnType: {
    type: ['TypeAnnotation', 'TSTypeAnnotation', 'Noop'],
    optional: true,
  },
  typeParameters: {
    type: [
      'TypeParameterDeclaration',
      'TSTypeParameterDeclaration',
      'Noop',
    ],
    optional: true,
  },
};

const functionDeclarationCommon = {
  ...functionCommon,
  declare: {
    type: 'boolean',
    optional: true,
  },
  id: {
    type: 'Identifier',
    optional: true, // May be null for `default function`
  },
};

const patternLikeCommon = {
  typeAnnotation: {
    // TODO: @babel/plugin-transform-flow-comments puts a Noop here, is there a better way?
    type: ['TypeAnnotation', 'TSTypeAnnotation', 'Noop'],
    optional: true,
  },
  decorators: {
    type: 'array',
    each: 'Decorator',
  },
};

const nodeTypes: {[key: string]: ASTNode} = {
  ArrayExpression: {
    fields: {
      elements: {
        type: 'array',
        each: ['null', 'Expression', 'SpreadElement'],
        default: [],
      },
    },
    visitor: ['elements'],
    aliases: ['Expression'],
  },

  AssignmentExpression: {
    fields: {
      operator: {
        type: 'string',
      },
      left: {
        type: 'LVal',
      },
      right: {
        type: 'Expression',
      },
    },
    visitor: ['left', 'right'],
    aliases: ['Expression'],
  },

  BinaryExpression: {
    fields: {
      operator: {
        type: BINARY_OPERATORS,
      },
      left: {
        type: 'Expression',
      },
      right: {
        type: 'Expression',
      },
    },
    visitor: ['left', 'right'],
    aliases: ['Binary', 'Expression'],
  },

  Directive: {
    visitor: ['value'],
    fields: {
      value: {
        type: 'DirectiveLiteral',
      },
    },
  },

  DirectiveLiteral: {
    fields: {
      value: {
        type: 'string',
      },
    },
  },

  BlockStatement: {
    visitor: ['directives', 'body'],
    fields: {
      directives: {
        type: 'array',
        each: 'Directive',
        default: [],
      },
      body: {
        type: 'array',
        each: 'Statement',
      },
    },
    aliases: ['Scopable', 'BlockParent', 'Block', 'Statement'],
  },

  BreakStatement: {
    visitor: ['label'],
    fields: {
      label: {
        type: 'Identifier',
        optional: true,
      },
    },
    aliases: ['Statement', 'Terminatorless', 'CompletionStatement'],
  },

  CallExpression: {
    visitor: ['callee', 'arguments', 'typeParameters'],
    aliases: ['Expression'],
    fields: {
      callee: {
        type: 'Expression',
      },
      arguments: {
        type: 'array',
        each: ['Expression', 'SpreadElement', 'JSXNamespacedName'],
      },
      optional: {
        type: [true, false],
        optional: true,
      }
    },
  },

  CatchClause: {
    visitor: ['param', 'body'],
    fields: {
      param: {
        type: 'Identifier',
        optional: true,
      },
      body: {
        type: 'BlockStatement',
      },
    },
    aliases: ['Scopable', 'BlockParent'],
  },

  ConditionalExpression: {
    visitor: ['test', 'consequent', 'alternate'],
    fields: {
      test: {
        type: 'Expression',
      },
      consequent: {
        type: 'Expression',
      },
      alternate: {
        type: 'Expression',
      },
    },
    aliases: ['Expression', 'Conditional'],
  },

  ContinueStatement: {
    visitor: ['label'],
    fields: {
      label: {
        type: 'Identifier',
        optional: true,
      },
    },
    aliases: ['Statement', 'Terminatorless', 'CompletionStatement'],
  },

  DebuggerStatement: {
    aliases: ['Statement'],
  },

  DoWhileStatement: {
    visitor: ['test', 'body'],
    fields: {
      test: {
        type: 'Expression',
      },
      body: {
        type: 'Statement',
      },
    },
    aliases: ['Statement', 'BlockParent', 'Loop', 'While', 'Scopable'],
  },

  EmptyStatement: {
    aliases: ['Statement'],
  },

  ExpressionStatement: {
    visitor: ['expression'],
    fields: {
      expression: {
        type: 'Expression',
      },
    },
    aliases: ['Statement', 'ExpressionWrapper'],
  },

  File: {
    visitor: ['program'],
    fields: {
      program: {
        type: 'Program',
      },
    },
  },

  ForInStatement: {
    visitor: ['left', 'right', 'body'],
    aliases: [
      'Scopable',
      'Statement',
      'For',
      'BlockParent',
      'Loop',
      'ForXStatement',
    ],
    fields: {
      left: {
        type: ['VariableDeclaration', 'LVal'],
      },
      right: {
        type: 'Expression',
      },
      body: {
        type: 'Statement',
      },
    },
  },

  ForStatement: {
    visitor: ['init', 'test', 'update', 'body'],
    aliases: ['Scopable', 'Statement', 'For', 'BlockParent', 'Loop'],
    fields: {
      init: {
        type: ['VariableDeclaration', 'Expression'],
        optional: true,
      },
      test: {
        type: 'Expression',
        optional: true,
      },
      update: {
        type: 'Expression',
        optional: true,
      },
      body: {
        type: 'Statement',
      },
    },
  },

  FunctionDeclaration: {
    visitor: ['id', 'params', 'body', 'returnType', 'typeParameters'],
    fields: {
      ...functionDeclarationCommon,
      ...functionTypeAnnotationCommon,
      body: {
        type: 'BlockStatement',
      },
    },
    aliases: [
      'Scopable',
      'Function',
      'BlockParent',
      'FunctionParent',
      'Statement',
      'Pureish',
      'Declaration',
    ],
  },

  FunctionExpression: {
    inherits: 'FunctionDeclaration',
    aliases: [
      'Scopable',
      'Function',
      'BlockParent',
      'FunctionParent',
      'Expression',
      'Pureish',
    ],
    fields: {
      ...functionCommon,
      ...functionTypeAnnotationCommon,
      id: {
        type: 'Identifier',
        optional: true,
      },
      body: {
        type: 'BlockStatement',
      },
    },
  },

  Identifier: {
    visitor: ['typeAnnotation'],
    aliases: ['Expression', 'PatternLike', 'LVal', 'TSEntityName'],
    fields: {
      ...patternLikeCommon,
      name: {
        type: 'string', // check out isValidIdentifier in Babel
      },
      optional: {
        type: 'boolean',
        optional: true,
      },
    },
  },

  IfStatement: {
    visitor: ['test', 'consequent', 'alternate'],
    aliases: ['Statement', 'Conditional'],
    fields: {
      test: {
        type: 'Expression',
      },
      consequent: {
        type: 'Statement',
      },
      alternate: {
        optional: true,
        type: 'Statement',
      },
    },
  },

  LabeledStatement: {
    visitor: ['label', 'body'],
    aliases: ['Statement'],
    fields: {
      label: {
        type: 'Identifier',
      },
      body: {
        type: 'Statement',
      },
    },
  },

  StringLiteral: {
    fields: {
      value: {
        type: 'string',
      },
    },
    aliases: ['Expression', 'Pureish', 'Literal', 'Immutable'],
  },

  NumericLiteral: {
    deprecatedAlias: 'NumberLiteral',
    fields: {
      value: {
        type: 'number',
      },
    },
    aliases: ['Expression', 'Pureish', 'Literal', 'Immutable'],
  },

  NullLiteral: {
    aliases: ['Expression', 'Pureish', 'Literal', 'Immutable'],
  },

  BooleanLiteral: {
    fields: {
      value: {
        type: 'boolean',
      },
    },
    aliases: ['Expression', 'Pureish', 'Literal', 'Immutable'],
  },

  RegExpLiteral: {
    deprecatedAlias: 'RegexLiteral',
    aliases: ['Expression', 'Literal'],
    fields: {
      pattern: {
        type: 'string',
      },
      flags: {
        type: 'string',
        default: '',
      },
    },
  },

  LogicalExpression: {
    visitor: ['left', 'right'],
    aliases: ['Binary', 'Expression'],
    fields: {
      operator: {
        type: LOGICAL_OPERATORS,
      },
      left: {
        type: 'Expression',
      },
      right: {
        type: 'Expression',
      },
    },
  },

  MemberExpression: {
    visitor: ['object', 'property'],
    aliases: ['Expression', 'LVal'],
    fields: {
      object: {
        type: 'Expression',
      },
      property: {
        type: ['Expression', 'Identifier']
      },
      computed: {
        default: false,
      },
      optional: {
        type: [true, false],
        optional: true,
      },
    },
  },

  NewExpression: {
    inherits: 'CallExpression'
  },

  Program: {
    visitor: ['directives', 'body'],
    fields: {
      sourceFile: {
        type: 'string',
      },
      sourceType: {
        type: 'enum',
        values: ['script', 'module'],
        default: 'script',
      },
      directives: {
        type: 'array',
        each: 'Directive',
        default: [],
      },
      body: {
        type: 'array',
        each: 'Statement',
      },
    },
    aliases: ['Scopable', 'BlockParent', 'Block'],
  },

  ObjectExpression: {
    visitor: ['properties'],
    aliases: ['Expression'],
    fields: {
      properties: {
        type: 'array',
        each: ['ObjectMethod', 'ObjectProperty', 'SpreadElement'],
      },
    },
  },

  ObjectMethod: {
    fields: {
      ...functionCommon,
      ...functionTypeAnnotationCommon,
      kind: {
        type: 'enum',
        values: ['method', 'get', 'set'],
        default: 'method',
      },
      computed: {
        type: 'boolean',
        default: false,
      },
      key: {
        type: [
          'Identifier',
          'StringLiteral',
          'NumericLiteral',
          'Expression']
      },
      decorators: {
        type: 'array',
        each: 'Decorator',
      },
      body: {
        type: 'BlockStatement',
      },
    },
    visitor: [
      'key',
      'params',
      'body',
      'decorators',
      'returnType',
      'typeParameters',
    ],
    aliases: [
      'UserWhitespacable',
      'Function',
      'Scopable',
      'BlockParent',
      'FunctionParent',
      'Method',
      'ObjectMember',
    ],
  },

  ObjectProperty: {
    fields: {
      computed: {
        type: 'boolean',
        default: false,
      },
      key: {
        type: [
          'Identifier',
          'StringLiteral',
          'NumericLiteral',
          'Expression']
      },
      value: {
        type: ['Expression', 'PatternLike'],
      },
      shorthand: {
        type: 'boolean',
        default: false,
      },
      decorators: {
        type: 'array',
        each: 'Decorator',
        optional: true,
      },
    },
    visitor: ['key', 'value', 'decorators'],
    aliases: ['UserWhitespacable', 'Property', 'ObjectMember'],
  },

  RestElement: {
    visitor: ['argument', 'typeAnnotation'],
    aliases: ['LVal', 'PatternLike'],
    deprecatedAlias: 'RestProperty',
    fields: {
      ...patternLikeCommon,
      argument: {
        type: 'LVal',
      },
    },
  },

  ReturnStatement: {
    visitor: ['argument'],
    aliases: ['Statement', 'Terminatorless', 'CompletionStatement'],
    fields: {
      argument: {
        type: 'Expression',
        optional: true,
      },
    },
  },

  SequenceExpression: {
    visitor: ['expressions'],
    fields: {
      expressions: {
        type: 'array',
        each: 'Expression',
      },
    },
    aliases: ['Expression'],
  },

  SwitchCase: {
    visitor: ['test', 'consequent'],
    fields: {
      test: {
        type: 'Expression',
        optional: true,
      },
      consequent: {
        type: 'array',
        each: 'Statement',
      },
    },
  },

  SwitchStatement: {
    visitor: ['discriminant', 'cases'],
    aliases: ['Statement', 'BlockParent', 'Scopable'],
    fields: {
      discriminant: {
        type: 'Expression',
      },
      cases: {
        type: 'array',
        each: 'SwitchCase',
      },
    },
  },

  ThisExpression: {
    aliases: ['Expression'],
  },

  ThrowStatement: {
    visitor: ['argument'],
    aliases: ['Statement', 'Terminatorless', 'CompletionStatement'],
    fields: {
      argument: {
        type: 'Expression',
      },
    },
  },

  TryStatement: {
    visitor: ['block', 'handler', 'finalizer'],
    aliases: ['Statement'],
    fields: {
      block: {
        type: 'BlockStatement',
      },
      handler: {
        type: 'CatchClause',
        optional: true,
      },
      finalizer: {
        optional: true,
        type: 'BlockStatement',
      },
    },
  },

  UnaryExpression: {
    fields: {
      prefix: {
        default: true,
      },
      argument: {
        type: 'Expression',
      },
      operator: {
        type: UNARY_OPERATORS,
      },
    },
    visitor: ['argument'],
    aliases: ['UnaryLike', 'Expression'],
  },

  UpdateExpression: {
    fields: {
      prefix: {
        default: false,
      },
      argument: {
        type: 'Expression',
      },
      operator: {
        type: UPDATE_OPERATORS,
      },
    },
    visitor: ['argument'],
    aliases: ['Expression'],
  },

  VariableDeclaration: {
    visitor: ['declarations'],
    aliases: ['Statement', 'Declaration'],
    fields: {
      declare: {
        type: 'boolean',
        optional: true,
      },
      kind: {
        type: 'enum',
        values: ['var', 'let', 'const'],
      },
      declarations: {
        type: 'array',
        each: 'VariableDeclarator',
      },
    },
  },

  VariableDeclarator: {
    visitor: ['id', 'init'],
    fields: {
      id: {
        type: 'LVal',
      },
      init: {
        type: 'Expression',
        optional: true,
      },
    },
  },

  WhileStatement: {
    visitor: ['test', 'body'],
    aliases: ['Statement', 'BlockParent', 'Loop', 'While', 'Scopable'],
    fields: {
      test: {
        type: 'Expression',
      },
      body: {
        type: ['BlockStatement', 'Statement'],
      },
    },
  },

  WithStatement: {
    visitor: ['object', 'body'],
    aliases: ['Statement'],
    fields: {
      object: {
        type: 'Expression',
      },
      body: {
        type: ['BlockStatement', 'Statement'],
      },
    },
  },

};

export default nodeTypes;