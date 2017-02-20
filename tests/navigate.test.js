import fs from 'fs';
import path from 'path';
import {List} from 'immutable';
import * as matchers from 'jest-immutable-matchers';

import parse from '../src/parse';
import navigate, {UP, DOWN} from '../src/navigate';


describe('navigate', () => {

  beforeEach(() => {
    jest.addMatchers(matchers);
  });

  const fixturesPath = path.join(__dirname, 'fixtures');
  for (const fixture of fs.readdirSync(fixturesPath)) it(fixture, () => {
    const fixturePath = path.join(fixturesPath, fixture);

    const input = require(path.join(fixturePath, 'input.json'));
    const root = parse(input);

    const paths = new List(require(path.join(fixturePath, 'path')).default);
    [
      [paths, DOWN],
      [paths.reverse().slice(1), UP]
    ].reduce(
      (startPath, [paths, direction]) => (
        paths.reduce(
          (path, expected) => {
            path = navigate(root, path, direction);
            expect(path).toEqualImmutable(new List(expected));
            return path;
          },
          startPath
        )
      ),
      new List()
    );
  });

});
