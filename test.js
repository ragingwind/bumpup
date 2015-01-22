'use strict';

var assert = require('assert');
var bumpup = require('./');

describe('bumpup', function(done) {
  it('should return packages from common package.json', function(done) {
    var opts = {
      input: './fixtures/package.json',
      regex: false,
      output: null
    };

    bumpup(opts, function() {
      assert.ok(true);
      done();
    });
  });

  it('should return packages from yeoman package.json', function(done) {
    var opts = {
      input: './fixtures/_package.json',
      regex: true,
      output: null
    };

    bumpup(opts, function() {
      assert.ok(true);
      done();
    });
  });
});
