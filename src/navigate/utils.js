// @flow
import {isArrayExpression, isObjectExpression} from 'babel-types';
import type {ASTNode} from '../types';

export function isNonEmptyCollection(node?: ASTNode) {
  return (isArrayExpression(node) || isObjectExpression(node))
    && !((node: any).properties || (node: any).elements).isEmpty();
}
