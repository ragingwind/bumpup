#!/usr/bin/env node

'use strict';

var meow = require('meow');
var bumpup = require('./bumpup');
var args = meow({
  help: [
      'Usage',
      '   bumpup package.json [OPTIONS]',
      '   bumpup package.json --parse=regex'
      '',
      'Options',
      '   --parse: Parse the package.json by `json` or `regex patter` `json` is default',
      '   --output: Output file name, If no file name, the package.json will be overwrite'
  ].join('\n')
});

if (args.input.length === 0) {
  args.showHelp();
  eixt(-1);
}

bumpup({
  input: args.input[0],
  regex: args.flags['parse'] ===  'regex' ? true : false,
  output: args.flags['output']
});
