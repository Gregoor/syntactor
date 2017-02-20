import {traverseUp, traverseDown} from './traverser';

export const UP = 'up';
export const DOWN = 'down';
export const LEFT = 'left';
export const RIGHT = 'right';

const navigate = (ast, path, direction) => {
  const isLowestLevel = path.isEmpty();
  const lastKey = path.last();

  switch (direction) {

    case UP:
      return isLowestLevel && lastKey === 0
        ? path
        : traverseUp(ast, path);

    case DOWN:
      return isLowestLevel && lastKey === ast.getIn(path.slice(0, -1)).size - 1
        ? path
        : traverseDown(ast, path);

    case LEFT:
      return path;

    case RIGHT:
      return path;

    default:
      throw new Error('Unexpected direction ' + direction)

  }
};

export default navigate
