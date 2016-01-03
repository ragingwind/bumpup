'use strict';

import test from 'ava';
import bumpup from './';
import _ from 'lodash';

test('should return packages from package.json', t => {
  var opts = {
    regex: false,
    output: null,
    verbose: true
  };

  bumpup('./fixtures/package.json', opts, function (err, deps) {
    t.ok(!err);
    t.ok(_.size(deps.deps) === 5);
    t.end();
  });
});

test('should return packages from package.json yeoman template', t => {
  var opts = {
    regex: true,
    output: null,
    verbose: true
  };

  bumpup('./fixtures/_package.json', opts, function (err, deps) {
    t.ok(!err);
    t.ok(_.size(deps.deps) === 27);
    t.end();
  });
});
