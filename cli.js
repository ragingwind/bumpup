#!/usr/bin/env node

'use strict';

var meow = require('meow');
var bumpup = require('./bumpup');
var inquirer = require('inquirer');
var path = require('path');
var fs = require('fs');

var cli = meow({
  help: [
    'Usage',
    '   bumpup package.json [OPTIONS]',
    '   bumpup package.json --regex --verbose',
    '   bumpup package.json --output new-package.json',
    '',
    'Options',
    '   --output: Output file name, If no file name, the package.json will be overwrite',
    '   --diff: Show what packages are changed',
    '   --verbose: Show what is going on'
  ].join('\n')
}, {
  default: {
    output: null,
    diff: false,
    verbose: false
  }
});

if (cli.input.length === 0) {
  cli.showHelp(-1);
}

bumpup(cli.input[0], cli.flags, function (err, deps) {
  var output = path.resolve(cli.flags.output ? cli.flags.output : cli.input[0]);

  if (err) {
    console.log('bumpup got an error', err);
    process.exit(-1);
  }

  // Show what packages are changed
  if (cli.flags.verbose) {
    console.log(deps.changes().join('\n'));
  }

  // Show what is changed in red color
  if (cli.flags.diff) {
    process.stderr.write(deps.diff());
  }

  // Write a file updated
  if (fs.existsSync(output)) {
    inquirer.prompt({
      type: 'confirm',
      name: 'overwrite',
      message: 'The output file already exists. Overwrite?'
    }, function (answers) {
      if (answers.overwrite) {
        fs.writeFileSync(output, deps.output);
      }
    });
  } else {
    fs.writeFileSync(output, deps.output);
  }
});
