// @flow
import {isArrayExpression, isObjectExpression, isObjectProperty} from 'babel-types';
import {List} from '../utils/proxy-immutable';
import nodeTypes from '../ast';
import type {ASTPath, VerticalDirection} from '../types';
import {isNonEmptyCollection} from './utils';

function updateLastKey(path: ASTPath, direction: VerticalDirection, size) {
  return path.update(-1, direction === 'UP'
    ? (n) => Math.max(0, parseInt(n, 10) - 1)
    : (n) => Math.min(size - 1, parseInt(n, 10) + 1)
  );
}

function isEnclosedExpression(node) {
  return isArrayExpression(node) || isObjectExpression(node);
}

export default function findVerticalNeighborPath(
  direction: VerticalDirection, ast: any/*ASTNode*/, startPath: ASTPath
) {
  return function find(path) {
    const isUp = direction === 'UP';

    const lastKey = path.last();
    const parentPath = path.butLast();
    const parentNode = ast.getIn(parentPath);
    if (!parentNode) {
      throw new Error('Cant happen');
    }
    const parentSize = parentNode.size;
    const grandParentPath = parentPath.butLast();

    if (lastKey === 'end') {
      if (isUp) {
        return parentPath.push(Math.max(0, parentSize - 1));
      }
      const lastGrandParentKey = grandParentPath.last();
      const greatGrandParentPath = grandParentPath.butLast();
      const greatGrandParentNode = ast.getIn(greatGrandParentPath);
      if (
        lastGrandParentKey !== 'value'
        || (typeof lastGrandParentKey === 'number'
        && isEnclosedExpression(greatGrandParentNode)
        && lastGrandParentKey === greatGrandParentNode.size - 1)
      ) {
        return greatGrandParentPath.push('end');
      }
      return find(greatGrandParentPath);
    }

    if (path.isEmpty()) {
      return new List();
    }

    const pathIsNonEmptyCollection = isNonEmptyCollection(ast.getIn(path));
    if (!isUp && pathIsNonEmptyCollection) {
      return path;
    }

    const childKeys = (nodeTypes[parentNode.type] || {}).visitor;
    if (childKeys) {
      const newKey = childKeys[childKeys.indexOf(lastKey) + (isUp ? -1 : 1)];
      const newPath = parentPath.push(newKey);
      return newKey === lastKey
        || (!isUp && !isNonEmptyCollection(ast.getIn(newPath)))
        || (isUp && !pathIsNonEmptyCollection)
        ? find(parentPath)
        : newPath;
    }
    
    if (typeof lastKey !== 'number') {
      return find(parentPath);
    }

    if (isUp && lastKey === 0) {
      return parentPath.get(-3) === 'elements' ? grandParentPath : find(grandParentPath);
    }

    const grandParentNode = ast.getIn(grandParentPath);
    if (!isUp && lastKey === parentSize - 1) {
      return isEnclosedExpression(grandParentNode) ? parentPath.push('end') : grandParentPath;
    }

    return updateLastKey(path, direction, parentSize);
  }(startPath);
}