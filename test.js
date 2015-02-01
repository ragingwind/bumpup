'use strict';

var assert = require('assert');
var bumpup = require('./');
var _  = require('lodash');

describe('bumpup', function(done) {
  it('should return packages from package.json', function(done) {
    var opts = {
      regex: false,
      output: null,
      verbose: true
    };

    bumpup('./fixtures/package.json', opts, function(err, deps) {
      assert(!err);
      assert(_.size(deps.deps) === 5);
      done();
    });
  });

  it('should return packages from package.json yeoman template', function(done) {
    var opts = {
      regex: true,
      output: null,
      verbose: true
    };

    bumpup('./fixtures/_package.json', opts, function(err, deps) {
      assert(!err);
      assert(_.size(deps.deps) === 27);
      done();
    });
  });
});
