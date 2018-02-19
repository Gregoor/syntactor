import fs from 'fs';
import path from 'path';
import * as matchers from 'jest-immutable-matchers';
import parse from '../../utils/parse';
import {List} from '../../utils/proxy-immutable';
import navigate from '../../navigate';

beforeEach(() => {
  jest.addMatchers(matchers);
});

const fixturesPath = path.join(__dirname, 'fixtures');
for (const fixture of fs.readdirSync(fixturesPath)) test(fixture, () => {
  const fixturePath = path.join(fixturesPath, fixture);

  const root = parse(require(path.join(fixturePath, 'input')).default);
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
