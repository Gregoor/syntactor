// @flow
import {isLiteral, isObjectExpression, isObjectProperty} from 'babel-types';
import {List} from 'immutable';
import nodeTypes from '../ast';
import type {ASTNode, ASTKey, VerticalDirection} from '../types';
import {isNonEmptyCollection} from './utils';

function findChildKey(node: ASTNode, keys: string[]): [?ASTKey, ?ASTNode] {
  const childKey = keys[0];

  const childNode = node.get(childKey);
  keys = keys.slice(keys.indexOf(childKey) + 1);

  if (childNode) return [childKey, ((childNode: any): ASTNode)];
  else if (keys.length === 0 || !childKey) return [null, null];
  else return findChildKey(node, keys);
}

export default function findVerticalPathIn(direction: VerticalDirection, node?: any/*ASTNode*/) {
  if (!node || isLiteral(node.toJS())) return new List();

  const isUp = direction === 'UP';

  if (isObjectProperty(node.toJS()) && !(isUp && isNonEmptyCollection(node.get('value')))) {
    return List.of('key');
  }

  const verticalKeys = nodeTypes[node.get('type')].visitor || [];
  const [childKey, childNode] = findChildKey(node, isUp ? verticalKeys.slice().reverse() : verticalKeys);

  if (!childKey || (!isUp && (!childKey || !childNode || isObjectExpression(childNode.toJS())))) {
    return new List();
  }

  let path = List.of(childKey);
  if (childNode instanceof List) {
    path = path.push(isUp ? 'end' : 0);
  }
  return path.concat(findVerticalPathIn(direction, node.getIn(path)));
};
