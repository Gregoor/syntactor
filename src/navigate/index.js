// @flow
import {is} from 'immutable';

import {isLiteral} from '../utils/checks';
import type {ASTNode, ASTPath, Direction, HorizontalDirection, VerticalDirection} from '../types';
import findVerticalNeighborPath from './find-vertical-neighbor-path';
import findVerticalPathIn from './find-vertical-path-in';

function traverseVertically(direction: VerticalDirection, ast: any/*ASTNode*/, path: ASTPath) {
  const isUp = direction === 'UP';
  if (!isUp && path.last() === 'end' && path.size === 2) return path;

  const neighborPath = findVerticalNeighborPath(direction, ast, path);
  if (
    (neighborPath.isEmpty() && isUp)
    || (
      !is(path, neighborPath) && neighborPath.get(-2) === 'elements'
      && !(isUp && path.last() === 'end')
    )
  ) return neighborPath;
  const newPath = ((neighborPath.concat(findVerticalPathIn(direction, ast.getIn(neighborPath))): any): ASTPath);
  return path.last() === 'value' && newPath.last() === 'key' && isLiteral(ast.getIn(newPath))
    ? newPath.set(-1, 'value')
    : newPath;
}

function traverseHorizontally(direction: HorizontalDirection, ast: any/*ASTNode*/, path: ASTPath) {
  const isLeft = direction === 'LEFT';

  const parentPath = path.slice(0, -1);
  const newKey = isLeft ? 'key' : 'value';
  const parentNode = ast.getIn(parentPath);
  if (parentNode && parentNode.get('type') === 'ObjectProperty' && newKey !== path.last()) {
    return parentPath.push(newKey);
  }

  const newPath = traverseVertically(isLeft ? 'UP' : 'DOWN', ast, path);
  const newParentNode = ast.getIn(newPath.slice(0, -1));
  return isLeft && newParentNode && newParentNode.get('type') === 'ObjectProperty'
    ? traverseHorizontally('RIGHT', ast, newPath)
    : newPath
}

export default function navigate(direction: Direction, ast: ASTNode, path: ASTPath) {
  if (direction === 'UP' || direction === 'DOWN') {
    return traverseVertically(direction, ast, path);
  } else if (['LEFT', 'RIGHT'].includes(direction)) {
    return traverseHorizontally(direction, ast, path);
  } else {
    throw new Error(`Unknown direction: ${direction}`);
  }
}