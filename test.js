'use strict';

var assert = require('assert');
var bumpup = require('./');

describe('bumpup', function(done) {
  it('should return packages from common package.json', function(done) {
    var opts = {
      regex: false,
      output: null,
      verbose: true
    };

    bumpup('./fixtures/package.json', opts, function() {
      assert.ok(true);
      done();
    });
  });

  it('should return packages from yeoman package.json template', function(done) {
    var opts = {
      regex: true,
      output: null,
      verbose: true
    };

    bumpup('./fixtures/_package.json', opts, function() {
      assert.ok(true);
      done();
    });
  });
});
