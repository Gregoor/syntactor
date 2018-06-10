// @flow
import {
  isArrayExpression,
  isBooleanLiteral,
  isExpression,
  isNullLiteral,
  isNumericLiteral,
  isObjectExpression,
  isStringLiteral,
  isVariableDeclaration
} from 'babel-types';
import type { ASTPath } from './types';

export type Modifier = 'ctrl' | 'alt' | 'shift';

type TestMapping = (node: any, path: ASTPath) => boolean;

export type KeyMapping = {|
  name?: string,
  type?: any,
  keys?: string[],
  modifiers?: Modifier[] | ((node: any, path: ASTPath) => Modifier[]),
  mappings?: KeyMapping[],
  test?: TestMapping
|};

const SET_BOOLEAN = {
  type: 'SET_BOOLEAN',
  mappings: [
    {
      type: true,
      keys: ['t']
    },
    {
      type: false,
      keys: ['f']
    }
  ]
};

export default ([
  {
    name: 'Modify',
    mappings: [
      {
        type: 'INSERT',
        keys: ['Enter']
      },
      {
        type: 'DELETE',
        keys: ['d'],
        modifiers: ['ctrl']
      },
      {
        type: 'MOVE',
        modifiers: ['alt'],
        mappings: [
          {
            type: 'UP',
            keys: ['ArrowUp']
          },
          {
            type: 'DOWN',
            keys: ['ArrowDown']
          }
        ]
      },
      {
        type: 'CHANGE_DECLARATION_KIND',
        mappings: ['const', 'let', 'var'].map(kind => ({type: kind, keys: [kind[0]]})),
        test: node => isVariableDeclaration(node)
      }
    ]
  },
  {
    name: 'Transform',
    mappings: [
      {
        ...SET_BOOLEAN,
        test: node => isBooleanLiteral(node)
      },
      {
        type: 'ADD_TO_NUMBER',
        mappings: [
          {
            type: 1,
            keys: ['i']
          },
          {
            type: 10,
            keys: ['i'],
            modifiers: ['shift']
          },
          {
            type: -1,
            keys: ['d']
          },
          {
            type: -10,
            keys: ['d'],
            modifiers: ['shift']
          }
        ],
        test: node => isNumericLiteral(node)
      },
      {
        type: 'TO_STRING',
        keys: ['s', "'"],
        test: node => !isStringLiteral(node)
      },
      {
        type: 'TO_NUMBER',
        keys: ['n'],
        test: node => !isNumericLiteral(node)
      },
      {
        ...SET_BOOLEAN,
        test: node => !isBooleanLiteral(node)
      },
      {
        type: 'TO_ARRAY',
        keys: ['a', '['],
        test: node => !isArrayExpression(node)
      },
      {
        type: 'TO_OBJECT',
        keys: ['o', String.fromCharCode(123)],
        test: node => !isObjectExpression(node)
      },
      {
        type: 'TO_NULL',
        keys: ['-'],
        test: node => !isNullLiteral(node)
      }
    ],
    modifiers: node =>
      isNullLiteral(node) || isBooleanLiteral(node) ? [] : ['alt'],
    test: (node, path) =>
      !['key', 'id'].includes(path.last()) && isExpression(node)
  },
  {
    name: 'General',
    mappings: [
      {
        type: 'UNDO',
        keys: ['z'],
        modifiers: ['ctrl']
      },
      {
        type: 'REDO',
        keys: ['z'],
        modifiers: ['ctrl', 'shift']
      },
      {
        type: 'COPY',
        keys: ['c'],
        modifiers: ['ctrl']
      },
      {
        type: 'PASTE',
        keys: ['v'],
        modifiers: ['ctrl']
      }
    ]
  }
]: KeyMapping[]);
