import assert from 'assert';
import fs from 'fs';
import path from 'path';
import parse from '../../utils/parse';
import {List} from '../../utils/proxy-immutable';
import navigate from '../../navigate';

const pathPrefix = List.of('program', 'body', 0, 'declarations', 0, 'init');

const fixturesPath = path.join(__dirname, 'fixtures');
for (const fixture of fs.readdirSync(fixturesPath)) test(fixture, () => {
  const fixturePath = path.join(fixturesPath, fixture);

  const root = parse(fs.readFileSync(path.join(fixturePath, 'input.js'), 'utf-8'));
  const expectedPaths = new List(require(path.join(fixturePath, 'path')).default);

  [
    [expectedPaths, 'RIGHT'],
    [expectedPaths.reverse().slice(1), 'LEFT']
  ].reduce(
    (startPath, [paths, direction]) => (
      paths.reduce(
        (path, expected) => {
          const newPath = navigate(direction, root, path);
          assert.deepEqual(
            newPath.slice(pathPrefix.size).toJS(),
            expected,
            'From [' + path.slice(pathPrefix.size).join(' > ') + '] to the ' + direction
          );
          return newPath;
        },
        startPath
      )
    ),
    pathPrefix
  );
});
