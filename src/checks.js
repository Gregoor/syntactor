// @flow

export function isBooleanLiteral(node) {
  return node.get('type') === 'BooleanLiteral';
}

export function isNumericLiteral(node) {
  return node.get('type') === 'NumericLiteral';
}

export function isStringLiteral(node) {
  return node.get('type') === 'StringLiteral';
}

export function isArrayExpression(node) {
  return node.get('type') === 'ArrayExpression';
}

export function isObjectExpression(node) {
  return node.get('type') === 'ObjectExpression';
}

export function isEditable(node: ASTNode) {
  return isStringLiteral(node) || isNumericLiteral(node);
}