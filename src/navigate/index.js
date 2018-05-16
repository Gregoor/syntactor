// @flow
import {
  isArrayExpression,
  isFile,
  isLiteral,
  isObjectExpression,
  isObjectProperty,
  isProgram,
  isVariableDeclarator,
  VISITOR_KEYS
} from 'babel-types';
import { is, List } from 'immutable';
import type { ASTNodeData, ASTPath, Direction } from '../types';

const NON_NAVIGATABLE_TESTS = [
  isFile,
  isProgram,
  isObjectProperty,
  isVariableDeclarator
];
const ENCLOSED_TESTS = [isArrayExpression, isObjectExpression];

function traverseFast(node, enter, path = List()) {
  if (!node) return;

  const keys = VISITOR_KEYS[node.type];
  if (!keys) return;

  if (NON_NAVIGATABLE_TESTS.every(test => !test(node))) {
    enter(path);
  }

  for (const key of keys) {
    const subNode = node[key];
    const subPath = path.push(key);

    if (Array.isArray(subNode)) {
      for (let i = 0; i < subNode.length; i++) {
        traverseFast(subNode[i], enter, subPath.push(i));
      }
      if (subNode.length && ENCLOSED_TESTS.some(test => test(node))) {
        enter(subPath.push('end'));
      }
    } else {
      traverseFast(subNode, enter, subPath);
    }
  }
}

function traverseAndCollectPaths(ast) {
  const paths = [];
  traverseFast(ast, path => {
    paths.push(path);
  });
  return paths;
}

function directionAsBools(direction: Direction) {
  return {
    isDown: direction === 'DOWN',
    isLeft: direction === 'LEFT',
    isRight: direction === 'RIGHT',
    isUp: direction === 'UP'
  };
}

const astPaths: Map<ASTNodeData, ASTPath[]> = new Map();
export default function navigate(
  direction: Direction,
  ast: ASTNodeData,
  path: ASTPath
) {
  const { isDown, isRight, isUp } = directionAsBools(direction);
  let paths: ASTPath[];
  if (astPaths.has(ast)) {
    paths = ((astPaths.get(ast): any): ASTPath[]);
  } else {
    paths = traverseAndCollectPaths(ast.toJS());
    astPaths.set(ast, paths);
  }
  const index = paths.findIndex(p => is(p, path));
  const nextPath = paths[index + (isDown || isRight ? 1 : -1)];
  return (isDown && path.last() === 'key') ||
    (isUp && path.last() === 'key' && nextPath.last() === 'value') ||
    ((isUp || isDown) &&
      path.last() === 'value' &&
      nextPath.last() === 'key' &&
      (isUp || isLiteral((ast: any).getIn(path))))
    ? paths[index + (isDown ? 2 : -2)] || nextPath || path
    : nextPath || path;
}
