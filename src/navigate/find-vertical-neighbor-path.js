// @flow
import {List} from 'immutable';

import type {ASTNode, ASTPath, VerticalDirection} from '../types';
import {isNonEmptyCollection} from './utils';

function updateLastIndex(path: ASTPath, direction: VerticalDirection, size) {
  return path.update(-1, direction === 'UP'
    ? (n) => Math.max(0, n - 1)
    : (n) => Math.min(size - 1, n + 1)
  );
}

export default function findVerticalNeighborPath(
  direction: VerticalDirection, ast: ASTNode, startPath: ASTPath
) {
  return function find(path) {
    const isUp = direction === 'UP';

    const lastKey = path.last();
    const parentPath = path.slice(0, -1);
    const parentNode = ast.getIn(parentPath);
    const parentSize = parentNode.size;

    if (lastKey === 'end') {
      if (isUp) {
        return parentPath.push(Math.max(0, parentSize - 1));
      } 

      const grandParentPath = parentPath.slice(0, -1);
      const lastGrandParentKey = grandParentPath.last();
      const grandGrandParentPath = grandParentPath.slice(0, -1);
      if (
        typeof lastGrandParentKey === 'number'
        && lastGrandParentKey === ast.getIn(grandGrandParentPath).size - 1
      ) {
        return grandGrandParentPath.push('end');
      }
      return find(grandGrandParentPath);
    }

    if (path.isEmpty()) {
      return new List();
    }

    const pathIsNonEmptyCollection = isNonEmptyCollection(ast.getIn(path));
    if (!isUp && pathIsNonEmptyCollection) {
      return path;
    }

    if (parentNode.get('type') === 'ObjectProperty') {
      const newKey = isUp ? 'key' : 'value';
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
      const grandParentPath = parentPath.slice(0, -1);
      return parentPath.get(-3) === 'elements' ? grandParentPath : find(grandParentPath);
    }
    if (!isUp && lastKey === parentSize - 1) {
      return parentPath.push('end');
    }

    return updateLastIndex(path, direction, parentSize);
  }(startPath);
}