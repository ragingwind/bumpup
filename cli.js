#!/usr/bin/env node

'use strict';

var meow = require('meow');
var bumpup = require('./bumpup');
var args = meow({
  help: [
      'Usage',
      '   bumpup <sources> [OPTIONS]',
      '',
      'Options',
      '   --regex, -x: Read packages using regex patterns',
      '   --output, -o: Output file name, Do not pass filename, if you want to file that has replaced versions'
  ].join('\n')
});

if (args.input.length === 0) {
  args.showHelp();
  eixt(-1);
}

bumpup({
  input: args.input[0],
  regex: (args.flags['regex'] || args.flags['x']) ? true : false,
  output: (args.flags['output'] || args.flags['o']) ? true : false
});
