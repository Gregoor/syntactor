import * as matchers from 'jest-immutable-matchers';
import parse, {parseObject} from '../../utils/parse';
import {List} from '../../utils/proxy-immutable';
import findVerticalPathIn from '../find-vertical-path-in';

beforeEach(() => {
  jest.addMatchers(matchers);
});

describe('collections', () => {
  function expectObjectPath(obj, direction, pathIn, pathOut) {
    expect(findVerticalPathIn(direction, parseObject(obj).getIn(pathIn)))
      .toEqualImmutable(new List(pathOut));
  }

  test('goes into prop key', () => {
    expectObjectPath({prop: 'value'}, 'UP', ['properties', 0], ['key']);
  });

  test('goes into array first element', () => {
    expectObjectPath({
      arr: [
        'elem'
      ]
    }, 'DOWN', ['properties', 0, 'value'], ['elements', 0]);
  });

  test('goes into array end', () => {
    expectObjectPath({
      arr: [
        'uno',
        'duos'
      ]
    }, 'UP', ['properties', 0], ['value', 'elements', 'end']);
  });

  test('goes into object first prop', () => {
    expectObjectPath({
      obj: {
        muchkey: 'wow'
      }
    }, 'DOWN', ['properties', 0, 'value'], ['properties', 0, 'key']);
  });

  test('goes into object end', () => {
    expectObjectPath({
      obj: {
        key1: 'here',
        key2: true
      }
    }, 'UP', ['properties', 0, 'value'], ['properties', 'end']);
  });

  test('goes not into primitive value', () => {
    expectObjectPath({
      primitive: true
    }, 'UP', ['properties', 0, 'key'], []);
  });

  test('goes to key when value empty array', () => {
    expectObjectPath({
      empty: []
    }, 'UP', ['properties', 0], ['key'])
  });
});

describe('code', () => {
  function expectCodePath(obj, direction, pathIn, pathOut) {
    expect(findVerticalPathIn(direction, parse(obj).getIn(pathIn)))
      .toEqualImmutable(new List(pathOut));
  }

  test('goes into declaration', () => {
    expectCodePath('var i = 23;', 'DOWN', [], ['program', 'body', 0, 'declarations', 0, 'id'])
  });
});