// @flow
import type {ASTNode} from '../types';

function compareType(node?: ASTNode, type: string) {
  return node && node.get('type') === type;
}

export function isBooleanLiteral(node?: ASTNode) {
  return compareType(node, 'BooleanLiteral');
}

export function isNullLiteral(node?: ASTNode) {
  return compareType(node, 'NullLiteral');
}

export function isNumericLiteral(node?: ASTNode) {
  return compareType(node, 'NumericLiteral');
}

export function isStringLiteral(node?: ASTNode) {
  return compareType(node, 'StringLiteral');
}

export function isArrayExpression(node?: ASTNode) {
  return compareType(node, 'ArrayExpression');
}

export function isObjectExpression(node?: ASTNode) {
  return compareType(node, 'ObjectExpression');
}

export function isObjectProperty(node?: ASTNode) {
  return compareType(node, 'ObjectProperty');
}

export function isEditable(node?: ASTNode) {
  return node && (isStringLiteral(node) || isNumericLiteral(node));
}