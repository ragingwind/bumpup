#!/usr/bin/env node

import path from 'path';
import meow from 'meow';
import Bumpup from './bumpup.js';

var cli = meow(
  `
  Usage
      bumpup package.json [OPTIONS]
      bumpup package.json --diff --output new-package.json

  Options
      --output: Output file name, If no file name, the package.json will be overwrite
      --diff: Show what packages are changed
      --dryRun: Do not write to package.json`,
  {
    importMeta: import.meta,
    flags: {
      output: {
        type: 'string',
        default: '',
      },
      diff: {
        type: 'boolean',
        default: false,
      },
      dryRun: {
        type: 'boolean',
        default: false,
      },
    },
  }
);

if (cli.input.length === 0) {
  cli.showHelp(-1);
}

const resolve = (target: string) => path.resolve(process.cwd(), target);

const pkgName = resolve(cli.input[0] as string);
const output = resolve(cli.flags.output ?? pkgName);
const { diff, dryRun } = cli.flags;

const bumpup = new Bumpup();

(async () => {
  await bumpup.bumpup(pkgName, output, { diff, dryRun });
})();
