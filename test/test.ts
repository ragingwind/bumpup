import test from 'ava';
import path from 'path';
import { fileURLToPath } from 'url';

const resolve = (target: string) => path.resolve(path.dirname(fileURLToPath(import.meta.url)), target);

import Dependency from '../src/dependency';

test('Should return packages in package.json', async (t) => {
  const d = new Dependency();
  const pkgs = await d.read(resolve('../fixtures/package.json'));

  for (const p of pkgs) {
    t.true(p.name.length > 0);
    t.true(p.version.length > 0);
    t.true(p.field.length > 0);
  }
});
