import {List} from 'immutable';
import * as matchers from 'jest-immutable-matchers';

import parse from '../../utils/parse';
import findVerticalPathIn from '../find-vertical-path-in';


const expectPath = (obj, direction, pathIn, pathOut) => {
  expect(findVerticalPathIn(direction, parse(obj).getIn(pathIn)))
    .toEqualImmutable(new List(pathOut));
};

beforeEach(() => {
  jest.addMatchers(matchers);
});

test('goes into prop key', () => {
  expectPath({prop: 'value'}, 'UP', ['properties', 0], ['key']);
});

test('goes into array first element', () => {
  expectPath({
    arr: [
      'elem'
    ]
  }, 'DOWN', ['properties', 0, 'value'], ['elements', 0]);
});

test('goes into array end', () => {
  expectPath({
    arr: [
      'uno',
      'duos'
    ]
  }, 'UP', ['properties', 0], ['value', 'elements', 'end']);
});

test('goes into object first prop', () => {
  expectPath({
    obj: {
      muchkey: 'wow'
    }
  }, 'DOWN', ['properties', 0, 'value'], ['properties', 0, 'key']);
});

test('goes into object end', () => {
  expectPath({
    obj: {
      key1: 'here',
      key2: true
    }
  }, 'UP', ['properties', 0, 'value'], ['properties', 'end']);
});

test('goes not into primitive value', () => {
  expectPath({
    primitive: true
  }, 'UP', ['properties', 0, 'key'], []);
});

test('goes to key when value empty array', () => {
  expectPath({
    empty: []
  }, 'UP', ['properties', 0], ['key'])
});
