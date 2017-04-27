import fs from 'fs';
import path from 'path';
import {List} from 'immutable';
import * as matchers from 'jest-immutable-matchers';

import parse from '../../utils/parse';
import navigate from '../../navigate';

describe('navigate', () => {

  beforeEach(() => {
    jest.addMatchers(matchers);
  });

  const fixturesPath = path.join(__dirname, 'fixtures');
  for (const fixture of fs.readdirSync(fixturesPath)) it(fixture, () => {
    const fixturePath = path.join(fixturesPath, fixture);

    const root = parse(require(path.join(fixturePath, 'input')));
    const paths = new List(require(path.join(fixturePath, 'path')).default);

    [
      [paths, 'RIGHT'],
      [paths.reverse().slice(1), 'LEFT']
    ].reduce(
      (startPath, [paths, direction]) => (
        paths.reduce(
          (path, expected) => {
            path = navigate(direction, root, path);
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
