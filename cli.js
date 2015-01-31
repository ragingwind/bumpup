#!/usr/bin/env node

'use strict';

var meow = require('meow');
var bumpup = require('./bumpup');
var inquirer = require("inquirer");
var path = require('path');
var fs = require('fs');
var chalk = require('chalk');
var jsdiff = require('diff');
var args = meow({
  help: [
      'Usage',
      '   bumpup package.json [OPTIONS]',
      '   bumpup package.json --regex --verbose',
      '   bumpup package.json --output new-package.json',
      '',
      'Options',
      '   --regex: Specify how to parse the package.json by regex. if not set? reading by json is default',
      '   --output: Output file name, If no file name, the package.json will be overwrite',
      '   --verbose: Show what is going on'
  ].join('\n')
});

if (args.input.length === 0) {
  args.showHelp();
  eixt(-1);
}

bumpup(args.input[0], args.flags, function(err, packages) {
  var outputFile = path.resolve(args.flags.output ? args.flags.output : args.input[0]);

  // Show what is changed in red color
  if (args.flags.verbose) {
    jsdiff.diffChars(packages.data.toString(), packages.output).forEach(function(part){
      var color = part.added ? chalk.bgRed.bold : chalk.white;
      if (!part.removed) {
        process.stderr.write(color(part.value));
      }
    });
  }

  var writePackageJson = function() {
    fs.writeFileSync(outputFile, packages.output);
  };

  fs.exists(outputFile, function(exists) {
    if (exists) {
      inquirer.prompt({
        type: 'confirm',
        name: 'overwrite',
        message: 'Would you like to overwrite the output file?'
      }, function(answers) {
        if (answers.overwrite) {
          writePackageJson();
        }
      });
    } else {
      writePackageJson();
    }
  });
});
