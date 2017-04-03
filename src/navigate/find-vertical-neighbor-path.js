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
      return isUp ? parentPath.push(Math.max(0, parentSize - 1)) : find(parentPath.slice(0, -2));
    }

    if (path.isEmpty()) {
      return new List();
    }

    const currentIsNonEmptyCollection = isNonEmptyCollection(ast.getIn(path));
    if (!isUp && currentIsNonEmptyCollection) {
      return path;
    }

    if (parentNode.get('type') === 'ObjectProperty') {
      const newKey = isUp ? 'key' : 'value';
      const newPath = parentPath.push(newKey);
      return newKey === lastKey || (newKey === 'value' && !isNonEmptyCollection(ast.getIn(newPath)))
        || (newKey === 'key' && !currentIsNonEmptyCollection)
        ? find(parentPath)
        : newPath;
    }
    
    if (typeof lastKey !== 'number') {
      return find(parentPath);
    }

    if (isUp && lastKey === 0) {
      return find(parentPath.slice(0, -1));
    }
    if (!isUp && lastKey === parentSize - 1) {
      return parentPath.push('end');
    }

    return updateLastIndex(path, direction, parentSize);
  }(startPath);
}