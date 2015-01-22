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

function readPackages(input, doRegex) {
  var deferred = q.defer();

  fs.readFile(path.resolve(input), function(err, data) {
    if (err) {
      deferred.reject(err);
      return;
    }

    try {
      var packages = {
        data: data,
        deps: null,
        raw: null
      };

      // make dependency list by json parsing or regexp execution
      if (!doRegex) {
        packages.raw = JSON.parse(data);
        packages.deps = _.merge(packages.raw.dependencies, packages.raw.devDependencies);
      } else {
        var r = {
          deps: /(devDependencies|dependencies)([^]*)},/gi,
          pkg: /\"([\w\d-]*)\"\W*:\W\"(.[\d.]*)\"/gi
        };

        var deps = r.deps.exec(data);
        var res;

        packages.raw = [];

        while ((res = r.pkg.exec(deps[0])) !== null) {
          packages.raw.push(res[0]);
        }
        packages.deps = JSON.parse('{' + packages.raw.join(',') + '}');
      }
    } catch (e) {
      deferred.reject(e);
    }

    deferred.resolve(packages);
  });

  return deferred.promise;
}

module.exports = function (opts, cb) {
  readPackages(opts.input, opts.regex).then(function(packages) {
    var requests = [];

    _.each(packages.deps, function(v, p) {
      console.log(p, v);
      requests.push(gatherPackage(p));
    });

    q.all(requests).then(function(data) {
      console.log(data[0]);
      cb();
    }).catch(function(err) {
      console.error(err);
      cb();
    });;
  });
}
