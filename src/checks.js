// @flow
import type {ASTNode} from './types';

export function isBooleanLiteral(node: ASTNode) {
  return node.get('type') === 'BooleanLiteral';
}

export function isNumericLiteral(node: ASTNode) {
  return node.get('type') === 'NumericLiteral';
}

export function isStringLiteral(node: ASTNode) {
  return node.get('type') === 'StringLiteral';
}

export function isArrayExpression(node: ASTNode) {
  return node.get('type') === 'ArrayExpression';
}

export function isObjectExpression(node: ASTNode) {
  return node.get('type') === 'ObjectExpression';
}

export function isEditable(node: ASTNode) {
  return isStringLiteral(node) || isNumericLiteral(node);
}