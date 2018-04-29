import assert from 'assert';
import fs from 'fs';
import path from 'path';
import parse from '../../utils/parse';
import {List} from '../../utils/proxy-immutable';
import navigate from '../../navigate';

findAndTest(path.join(__dirname, 'fixtures'));

const globalPathPrefix = List.of('program', 'body');

function findAndTest(basePath, breadcrumbs = []) {
  for (const fixture of fs.readdirSync(basePath)) {
    const subBreadcrumbs = [...breadcrumbs, fixture];

    const fixturePath = path.join(basePath, fixture);
    if (!fs.lstatSync(fixturePath).isDirectory()) continue;

    const inputPath = path.join(fixturePath, 'input.js');
    const resultPath = path.join(fixturePath, 'path');

    findAndTest(fixturePath, subBreadcrumbs);
    
    if (!fs.existsSync(inputPath) || !fs.existsSync(resultPath + '.js')) continue;

    test(subBreadcrumbs.join(' > '), () => {
      const root = parse(fs.readFileSync(inputPath, 'utf-8'));
      const expectedPaths = new List(require(resultPath).default);

      const pathPrefix = globalPathPrefix.concat(
        subBreadcrumbs.includes('json')
          ? [0, 'declarations', 0, 'init']
          : []
      );

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
  }
}
