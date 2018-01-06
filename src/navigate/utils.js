// @flow
import type {ASTNode} from '../types';

export function isNonEmptyCollection(node?: ASTNode) {
  return node && node.get && ['ArrayExpression', 'ObjectExpression'].includes(node.get('type'))
    && !((node.get('properties') || node.get('elements')): any).isEmpty();
}
