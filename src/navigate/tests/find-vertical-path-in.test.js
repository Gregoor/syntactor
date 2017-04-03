import {List} from 'immutable';
import * as matchers from 'jest-immutable-matchers';

import parse from '../../parse';
import findVerticalPathIn from '../find-vertical-path-in';


const expectPath = (obj, direction, pathIn, pathOut) => {
  expect(findVerticalPathIn(direction, parse(obj).getIn(pathIn)))
    .toEqualImmutable(new List(pathOut));
};

describe('findVerticalPathIn', () => {

  beforeEach(() => {
    jest.addMatchers(matchers);
  });

  it('goes into prop key', () => {
    expectPath({prop: 'value'}, 'UP', ['properties', 0], ['key']);
  });

  it('goes into array first element', () => {
    expectPath({
      arr: [
        'elem'
      ]
    }, 'DOWN', ['properties', 0, 'value'], ['elements', 0]);
  });

  it('goes into array end', () => {
    expectPath({
      arr: [
        'uno',
        'duos'
      ]
    }, 'UP', ['properties', 0], ['value', 'elements', 'end']);
  });

  it('goes into object first prop', () => {
    expectPath({
      obj: {
        muchkey: 'wow'
      }
    }, 'DOWN', ['properties', 0, 'value'], ['properties', 0, 'key']);
  });

  it('goes into object end', () => {
    expectPath({
      obj: {
        key1: 'here',
        key2: true
      }
    }, 'UP', ['properties', 0, 'value'], ['properties', 'end']);
  });

  it('goes not into primitive value', () => {
    expectPath({
      primitive: true
    }, 'UP', ['properties', 0, 'key'], []);
  });

  it('goes to key when value empty array', () => {
    expectPath({
      empty: []
    }, 'UP', ['properties', 0], ['key'])
  });

});