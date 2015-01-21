'use strict';

var _  = require('lodash');
var NpmRegistryClient = require('npm-registry-client')
var q = require('q');
var fs = require('fs');
var path = require('path');

function gatherPackage (packageName) {
  var client = new NpmRegistryClient();
  var uri = 'http://registry.npmjs.org/' + packageName;
  var params = {
    timeout: 1000
  };
  var deferred = q.defer();
  client.get(uri, params, function(err, data, raw, res) {
    if (err) {
      return deferred.reject(err);
    }

    deferred.resolve(data);
  });
  return deferred.promise;
}

function readPackages(input, parseRegex) {
  var deferred = q.defer();

  fs.readFile(path.resolve(opts.input), function(err, data) {
    if (err) {
      deferred.reject(err);
      return;
    }

    var packages;

    if (!parseRegex) {
      data = JSON.parse(data);
      packages = _.merge(data.dependencies, data.devDependencies);
      deferred.resolve(packages);
    } else {

    }

    deferred.resolve(packages);
  });

  return deferred.promise;
}

module.exports = function (opts, cb) {
  readPackages(opts).then(function(packages) {
    var requests = [];

    console.log(packages);
    cb();
    return;

    packages.forEach(function(p) {
      requests.push(gatherPackage(p));
    });

    q.all(requests).then(function(data) {
      console.log(data[0]);
    });
  }).catch(function(err) {
    console.error(err);
    cb();
  });;
};
