import test from 'ava';
import path from 'path';
import { fileURLToPath } from 'url';

const resolve = (target: string) => path.resolve(path.dirname(fileURLToPath(import.meta.url)), target);

import Bumpup from '../src/bumpup';

test('Should return packages in package.json', async (t) => {
  const d = new Bumpup();
  const pkg = d.readPackage(resolve('../fixtures/package.json'));
  const deps = d.readDependencies(pkg);

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
  const d = new Bumpup();
  await d.bumpup(resolve('../fixtures/package.json'), resolve('../fixtures/package-bumped.json'));

  const dest = d.readPackage(resolve('../fixtures/package-bumped.json'));

  const [pkgName, pkgVersion] = Object.entries(dest.dependencies)[0] as any;
  const pkgInfo = (await d.requestNpmInfo(pkgName)) as any;

  t.assert(dest);
  t.deepEqual(pkgInfo['dist-tags'].latest, pkgVersion);
});
