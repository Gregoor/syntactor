import {List} from 'immutable';

const yKeys = List.of('elements', 'properties', 'key', 'value');

const isYKey = (key) => yKeys.includes(key);
const isNodeKeyOf = (node) => (key) => node && node.keySeq().includes(key);
const isLiteral = (node) => (
  node.get && ['StringLiteral', 'NumericLiteral'].includes(node.get('type'))
);


const findYNeighborPath = ({checkFringe, updateIndex}, ast, startPath) => function find(path) {
  const lastKey = path.last();
  const parentPath = path.slice(0, -1);
  const parentNode = ast.getIn(parentPath);
  const parentSize = parentNode.size;

  if (path.isEmpty()) {
    return path;
  } else if (isYKey(lastKey) || checkFringe(parentSize, lastKey)) {
    const prevBodyKey = path.last();
    const newBodyKey = yKeys
      .slice(yKeys.indexOf(prevBodyKey) + 1)
      .find(isNodeKeyOf(parentNode));
    path = parentPath;
    const newPath = path.push(newBodyKey);
    const childNode = newBodyKey && ast.getIn(newPath);
    if (isLiteral(childNode)) {
      return path.update(-1, updateIndex.bind(null, parentSize));
    }
    return childNode ? newPath : find(path);
  } else if (typeof lastKey === 'number') {
    return path.update(-1, updateIndex.bind(null, parentSize));
  } else {
    return find(parentPath);
  }
}(startPath);

export const findPrevYNeighborPath = findYNeighborPath.bind(null, {
  checkFringe: (size, n) => n === 0,
  updateIndex: (size, n) => Math.max(0, n - 1)
});

export const findNextYNeighborPath = findYNeighborPath.bind(null, {
  checkFringe: (size, n) => n === size - 1,
  updateIndex: (size, n) => Math.min(size - 1, n + 1)
});


const findChildKey = (node, keys = yKeys) => {
  const childKey = keys.find(isNodeKeyOf(node));
  const childNode = node.get(childKey);
  keys = keys.slice(keys.indexOf(childKey) + 1);

  if (childNode) return [childKey, childNode];
  else if (keys.isEmpty() || !childKey) return [];
  else return findChildKey(node, keys);
};

const findPathIn = ({getIndex}, startNode) => function findIn(node) {
  const [childKey, childNode] = findChildKey(node);
  if (!childNode || isLiteral(node)) return new List();

  let path = List.of(childKey);
  if (childNode instanceof List) {
    path = path.push(getIndex(childNode.size));
  }
  return path.concat(findIn(node.getIn(path)));
}(startNode);

export const findFirstPathIn = findPathIn.bind(null, {
  getIndex: () => 0
});

export const findLastPathIn = findPathIn.bind(null, {
  getIndex: (size, n) => size - 1
});


const createTraverser = (findYNeighborPath, findPathIn) => (ast, path) => {
  const neighborPath = findYNeighborPath(ast, path);
  return neighborPath.concat(findPathIn(ast.getIn(neighborPath)));
};

export const traverseUp = createTraverser(findPrevYNeighborPath, findLastPathIn);

export const traverseDown = createTraverser(findNextYNeighborPath, findFirstPathIn);