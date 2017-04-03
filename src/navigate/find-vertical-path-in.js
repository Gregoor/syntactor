// @flow
import {List} from 'immutable';

import type {ASTNode, ASTKey, VerticalDirection} from '../types';
import {isNonEmptyCollection} from './utils';

const verticalKeys: List<string> = List.of('elements', 'properties', 'key', 'value');

function isLiteral(node: ASTNode) {
  return ['StringLiteral', 'NumericLiteral', 'BooleanLiteral'].includes(node.get('type'));
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

export default function findVerticalPathIn(direction: VerticalDirection, startNode?: ASTNode) {
  return function findIn(node) {
    if (!node || isLiteral(node)) return new List();

    const isUp = direction === 'UP';

    if (
      node.get('type') === 'ObjectProperty' &&
      !(isUp && isNonEmptyCollection(node.get('value')))
    ) {
      return List.of('key');
    }

    const [childKey, childNode] = findChildKey(
      node, isUp ? verticalKeys.reverse() : verticalKeys
    );

    if (!childKey || !childNode || childNode.get('type') === 'ObjectExpression') return new List();

    if (['number', 'string', 'boolean'].includes(typeof childNode) || isLiteral(childNode)) {
      return List.of(childKey);
    }

    let path = List.of(childKey);
    if (childNode instanceof List) {
      path = path.push(isUp ? 'end' : 0);
    }
    return path.concat(findIn(node.getIn(path)));
  }(startNode)
};
