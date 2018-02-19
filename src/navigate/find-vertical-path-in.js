// @flow
import {isLiteral, isObjectExpression, isObjectProperty} from 'babel-types';
import {List} from '../utils/proxy-immutable';
import nodeTypes from '../ast';
import type {ASTNode, ASTKey, VerticalDirection} from '../types';
import {isNonEmptyCollection} from './utils';

function findChildKey(node: ASTNode, keys: List<string>): [?ASTKey, ?ASTNode] {
  const childKey = keys.first();

  const childNode = node.get(childKey);
  keys = keys.slice(keys.indexOf(childKey) + 1);

  if (childNode) return [childKey, ((childNode: any): ASTNode)];
  else if (keys.isEmpty() || !childKey) return [null, null];
  else return findChildKey(node, keys);
}

export default function findVerticalPathIn(direction: VerticalDirection, node?: any/*ASTNode*/) {
  if (!node || isLiteral(node)) return new List();

  const isUp = direction === 'UP';

  if (isObjectProperty(node) && !(isUp && isNonEmptyCollection(node.value))) {
    return List.of('key');
  }

  const verticalKeys = new List(nodeTypes[node.type].visitor || []);
  const [childKey, childNode] = findChildKey(node, isUp ? verticalKeys.reverse() : verticalKeys);

  if (!childKey || (!isUp && (!childKey || isObjectExpression(childNode)))) {
    return new List();
  }

  let path = List.of(childKey);
  if (childNode instanceof List) {
    path = path.push(isUp ? 'end' : 0);
  }
  return path.concat(findVerticalPathIn(direction, node.getIn(path)));
};
