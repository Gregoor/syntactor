// @flow
import {isArrayExpression, isObjectExpression} from 'babel-types';
import type {ASTNodeData} from '../types';

export function isNonEmptyCollection(node?: ASTNodeData) {
  return (isArrayExpression(node) || isObjectExpression(node))
    && !((node: any).properties || (node: any).elements).isEmpty();
}
