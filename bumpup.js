'use strict';

var _  = require('lodash');
var NpmRegistryClient = require('npm-registry-client')
var q = require('q');
var fs = require('fs');
var path = require('path');
var semver = require('semver');
var semverDiff = require('semver-diff');
var chalk = require('chalk');

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

function readPackages(input, readAsJson) {
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

      if (readAsJson) {
        packages.raw = JSON.parse(data);
        packages.deps = _.merge(packages.raw.dependencies, packages.raw.devDependencies);
      } else {
        var r = {
          deps: /(devDependencies|dependencies)([^]*)},/gi,
          pkg: /\"([\w\d-]*)\"\W*:\W\"([\d.^<>=~]*)\"/gi
        };

        var deps = r.deps.exec(data);
        var res;

        packages.raw = [];

        while ((res = r.pkg.exec(deps[0])) !== null) {
          packages.raw.push(res[0]);
        }
        packages.deps = JSON.parse('{' + packages.raw.join(',') + '}');
        console.log(packages.deps);
      }
    } catch (e) {
      deferred.reject(e);
    }

    deferred.resolve(packages);
  });

  return deferred.promise;
}

module.exports = function (opts, cb) {
  // Get a package list from json/template file
  readPackages(opts.input, !opts.regex).then(function(packages) {
    var requests = [];

    // Gather each package information via npm
    _.each(packages.deps, function(v, p) {
      requests.push(gatherPackage(p));
    });

    q.all(requests).then(function(res) {
      var updates = [];

      // Make a update list
      _.forEach(res, function(r) {
        var current = /\d*\.\d*\.\d*/.exec(packages.deps[r.name])[0];
        var latest = r['dist-tags'].latest;

        var u = {
          name: r.name,
          current: current,
          latest: latest,
          updatable: semver.gt(latest, current),
          difftype: semverDiff(current, latest)
        }

        updates.push(u);

        // Show what it has different version
        console.log(chalk.green(u.name) + '@' + u.current,
          u.updatable ? ['can be updated to', chalk.red.bold(u.latest),
                          chalk.bold(u.difftype), 'version'].join(' ') : 'has no diff');
      });

      // Confirm that approve a updating
      cb();
    }).catch(function(err) {
      console.error(err);
      cb(err);
    });;
  });
}
