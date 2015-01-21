'use strict';

var assert = require('assert');
var bumpup = require('./');

describe('bumpup test', function(done) {

  it('should return packages list', function(done) {
    var opts = {
      input: './fixtures/package.json',
      regex: false,
      interactive: false,
      output: null
    };

    bumpup(opts, function() {
      console.log('a');
      assert.ok(true);
      done();
    });
  });
});
