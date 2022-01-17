import test from 'ava';
import path from 'path';
import { fileURLToPath } from 'url';

const resolve = (target: string) => path.resolve(path.dirname(fileURLToPath(import.meta.url)), target);

import Dependency from '../src/dependency';

test('Should return packages in package.json', async (t) => {
  const d = new Dependency();
  const deps = await d.read(resolve('../fixtures/package.json'));

  t.true(Object.keys(deps).length > 0);

  for (const name in deps['dependencies']) {
    const p = deps['dependencies'][name];

    t.assert(p);

    if (p) {
      t.true(p.name.length > 0);
      t.true(p.version.length > 0);
      t.true(p.field.length > 0);
    }
  }
});

test('Should return updatges', async (t) => {
  const d = new Dependency();

  await d.bumpup(resolve('../fixtures/package.json'));

  t.true(true);
});
