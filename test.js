import test from 'ava';
import _ from 'lodash';
import bumpup from './';

test('should return packages from package.json', (t) => {
  var opts = {
    regex: false,
    output: null,
    verbose: true,
  };

  bumpup('./fixtures/package.json', opts, function (err, deps) {
    t.true(!err);
    t.true(_.size(deps.deps) === 5);
  });
});

test('should return packages from package.json yeoman template', (t) => {
  var opts = {
    regex: true,
    output: null,
    verbose: true,
  };

  bumpup('./fixtures/_package.json', opts, function (err, deps) {
    t.true(!err);
    t.true(_.size(deps.deps) === 27);
  });
});
