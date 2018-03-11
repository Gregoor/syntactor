import * as matchers from 'jest-immutable-matchers';
import parse, {parseObject} from '../../utils/parse';
import {List} from '../../utils/proxy-immutable';
import findVerticalNeighborPath from '../find-vertical-neighbor-path';

function expectObjectPath(obj, direction, pathIn, pathOut) {
  expect(findVerticalNeighborPath(direction, parseObject(obj), new List(pathIn)))
    .toEqualImmutable(new List(pathOut));
}

function expectCodePath(code, direction, pathIn, pathOut) {
  expect(findVerticalNeighborPath(direction, parse(code), new List(pathIn)))
    .toEqualImmutable(new List(pathOut));
}

beforeEach(() => {
  jest.addMatchers(matchers);
});

describe('simple object', () => {
  const simpleObj = {
    mr: 'Meeseeks',
    outOfBox: true,
  };

  test('goes to next prop', () => {
    expectObjectPath(simpleObj, 'DOWN', ['properties', 0, 'key'], ['properties', 1]);
  });

  test('goes to previous prop', () => {
    expectObjectPath(simpleObj, 'UP', ['properties', 1, 'key'], ['properties', 0]);
  });

  test('goes to previous prop from value', () => {
    expectObjectPath(simpleObj, 'UP', ['properties', 1, 'value'], ['properties', 0]);
  });
});

describe('object with array', () => {
  const withArray = {
    lookAt: [
      'me'
    ],
    nextProp: 'hai'
  };

  test('goes from key to array value', () => {
    expectObjectPath(withArray, 'DOWN', ['properties', 0, 'key'], ['properties', 0, 'value']);
  });

  test('goes down to end of array', () => {
    expectObjectPath(
      withArray, 'DOWN',
      ['properties', 0, 'value', 'elements', 0, 'value'],
      ['properties', 0, 'value', 'elements', 'end']
    );
  });

  test('goes from end of array to last element', () => {
    expectObjectPath(
      withArray, 'UP',
      ['properties', 0, 'value', 'elements', 'end'],
      ['properties', 0, 'value', 'elements', 0]
    );
  });

  test('goes to property after end of array', () => {
    expectObjectPath(
      withArray, 'DOWN',
      ['properties', 0, 'value', 'elements', 'end'],
      ['properties', 1]
    );
  });

  test('stays the same for array value', () => {
    expectObjectPath(withArray, 'DOWN', ['properties', 0, 'value'], ['properties', 0, 'value'])
  });
});

describe('deep object', () => {
  const deepObj = {
    spawnedBy: {
      a: 'Jerry'
    }
  };

  test('stays the same for object value', () => {
    expectObjectPath(deepObj, 'DOWN', ['properties', 0, 'value'], ['properties', 0, 'value'])
  });

  test('goes an object layer up', () => {
    expectObjectPath(deepObj, 'UP', ['properties', 0, 'value', 'properties', 0, 'key'], ['properties', 0, 'key'])
  });
});

test('goes an array layer up', () => {
  expectObjectPath({
    arr: [
      'suchelement'
    ]
  }, 'UP', ['properties', 0, 'value', 'elements', 0, 'value'], ['properties', 0, 'key']);
});

test('goes to next prop, if current is empty array', () => {
  expectObjectPath({
    empty: [],
    nextProp: 'oh hey'
  }, 'DOWN', ['properties', 0, 'key'], ['properties', 1]);
});

test('goes to next element', () => {
  expectObjectPath([
    1,
    2
  ], 'DOWN', ['elements', 0], ['elements', 1]);
});

test('goes to obj element', () => {
  expectObjectPath([
    1,
    {
      key: 'value'
    }
  ], 'DOWN', ['elements', 0], ['elements', 1]);
});

test('goes to end of array', () => {
  expectObjectPath([0], 'DOWN', ['elements', 0], ['elements', 'end']);
});

test('goes to end of array from inner object end', () => {
  expectObjectPath([{n: 0}], 'DOWN', ['elements', 0, 'properties', 'end'], ['elements', 'end']);
});

test('goes from declaration to start', () => {
  expectCodePath(
    'var i = 23;',
    'DOWN',
    ['program', 'body', 0, 'declarations', 0, 'id'],
    ['program', 'body', 0]
  )
});

test('goes to 2nd declaration', () => {
  expectCodePath(
    'var i = 23, j = 42;',
    'DOWN',
    ['program', 'body', 0, 'declarations', 0],
    ['program', 'body', 0, 'declarations', 1]
  )
});
