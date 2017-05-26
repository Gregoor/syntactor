// @flow
import {List} from 'immutable';

import type {ASTNode, ASTKey, VerticalDirection} from '../types';
import {isNonEmptyCollection} from './utils';

const verticalKeys: List<string> = List.of('elements', 'properties', 'key', 'value');

const literals = ['StringLiteral', 'NullLiteral', 'NumericLiteral', 'BooleanLiteral'];
function isLiteral(node?: ASTNode) {
  return node && literals.includes(node.get('type'));
}

function isNodeKeyOf(node: ASTNode) {
  return (key: ASTKey) => node.keySeq().includes(key.toString());
}

function findChildKey(node: ASTNode, keys: List<string>): [?ASTKey, ?ASTNode] {
  const childKey = keys.find(isNodeKeyOf(node));

  if (!childKey) return [null, null];

  const childNode = node.get(childKey);
  keys = keys.slice(keys.indexOf(childKey) + 1);

  if (childNode) return [childKey, childNode];
  else if (keys.isEmpty() || !childKey) return [null, null];
  else return findChildKey(node, keys);
}

export default function findVerticalPathIn(direction: VerticalDirection, node?: ASTNode) {
  if (!node || isLiteral(node)) return new List();

  const isUp = direction === 'UP';

  if (node.get('type') === 'ObjectProperty' && !(isUp && isNonEmptyCollection(node.get('value')))) {
    return List.of('key');
  }

  const [childKey, childNode] = findChildKey(node, isUp ? verticalKeys.reverse() : verticalKeys);

  if (!isUp && (!childKey || !childNode || childNode.get('type') === 'ObjectExpression')) {
    return new List();
  }

  let path = List.of(childKey);
  if (childNode instanceof List) {
    path = path.push(isUp ? 'end' : 0);
  }
  return path.concat(findVerticalPathIn(direction, node.getIn(path)));
};
