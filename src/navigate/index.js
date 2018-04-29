// @flow
import {isObjectProperty} from 'babel-types';
import {is} from '../utils/proxy-immutable';
import type {ASTNodeData, ASTPath, Direction, HorizontalDirection, VerticalDirection} from '../types';
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
  return neighborPath.concat(findVerticalPathIn(direction, ast.getIn(neighborPath)));
}

function traverseHorizontally(direction: HorizontalDirection, ast: any/*ASTNode*/, path: ASTPath) {
  const isLeft = direction === 'LEFT';

  const parentPath = path.slice(0, -1);
  const newKey = isLeft ? 'key' : 'value';
  const parentNode = ast.getIn(parentPath);
  if (isObjectProperty(parentNode) && newKey !== path.last()) {
    return parentPath.push(newKey);
  }

  const newPath = traverseVertically(isLeft ? 'UP' : 'DOWN', ast, path);
  const newParentNode = ast.getIn(newPath.slice(0, -1));
  return isLeft && isObjectProperty(newParentNode)
    ? traverseHorizontally('RIGHT', ast, newPath)
    : newPath;
}

export default function navigate(direction: Direction, ast: ASTNodeData, path: ASTPath) {
  if (!ast.getIn(path.last() === 'end' ? path.butLast() : path)) {
    throw new Error('Invalid path: ' + path.toJS().toString());
  }
  if (direction === 'UP' || direction === 'DOWN') {
    return traverseVertically(direction, ast, path);
  } else {
    return traverseHorizontally(direction, ast, path);
  }
}