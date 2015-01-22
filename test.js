'use strict';

var assert = require('assert');
var bumpup = require('./');

describe('bumpup test', function(done) {
  it('should return packages list from common package.json', function(done) {
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
});
