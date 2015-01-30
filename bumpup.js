'use strict';

var _  = require('lodash');
var NpmRegistryClient = require('npm-registry-client')
var q = require('q');
var fs = require('fs');
var path = require('path');
var semver = require('semver');
var semverDiff = require('semver-diff');
var chalk = require('chalk');
var npmlog = require('npmlog');

// +TODO: create a packages object
function gatherPackage (packageName) {
  var client = new NpmRegistryClient({log: npmlog});
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

function readPackages(input, readAsJSON) {
  var deferred = q.defer();

  fs.readFile(path.resolve(input), function(err, data) {
    if (err) {
      deferred.reject(err);
      return;
    }

    try {
      var packages = {
        data: data,
        input: null,
        pkgs: {},
        type: 'json'
      };
      var semverRegex = /\d*\.\d*\.\d*/;

      if (readAsJSON) {
        var appendPackage = function(pkgs, json, deptype) {
          _.forEach(json[deptype], function(current, name) {
            pkgs[name] = {
              name: name,
              deptype: deptype,
              currentOrigin: current,
              current: semverRegex.exec(current)[0]
            };
          });
        };

        var json = JSON.parse(data);

        appendPackage(packages.pkgs, json, 'dependencies');
        appendPackage(packages.pkgs, json, 'devDependencies');
      } else {
        var appendPackage = function(pkgs, data, deptype) {
          var r = {
            dependencies: /(\"dependencies\")([^}]*)/gi,
            devDependencies: /(\"devDependencies\")([^]*)},/gi,
            pkg: /\"([\w\d-]*)\"\W*:\W\"([\d.^<>=~]*)\"/gi
          };
          var input = r[deptype].exec(data);
          var res;

          while ((res = r.pkg.exec(input)) !== null) {
            pkgs[res[1]] = {
              name: res[1],
              deptype: deptype,
              packageOrigin: res[0],
              currentOrigin: res[2],
              current: semverRegex.exec(res[2])[0]
            };
          };
        };

        packages.type = 'regex';
        appendPackage(packages.pkgs, data, 'dependencies');
        appendPackage(packages.pkgs, data, 'devDependencies');
      }
    } catch (e) {
      deferred.reject(e);
    }

    deferred.resolve(packages);
  });

  return deferred.promise;
}

// unclear arguments
function updatePackages(packages) {
  var output = packages.type === 'json' ? JSON.parse(packages.data) :
                                         packages.data.toString();

  _.forEach(packages.pkgs, function(p) {
    if (p.updatable) {
      if (packages.type === 'json') {
        output[p.deptype][p.name] = p.latest;
      } else {
        var latest = p.currentOrigin.replace(p.current, p.latest);
        var newPackage = p.packageOrigin.replace(p.currentOrigin, latest);
        output = output.replace(p.packageOrigin, newPackage);
      }
    }
  });

  return packages.output = (packages.type === 'json') ? JSON.stringify(output, null, 2) : output;
};

module.exports = function (packageJson, opts, cb) {
  // set npm logging level
  if (!opts.verbose) {
    npmlog.level = 'silent';
  }

  // Get a package list from json/template file
  readPackages(packageJson, opts.regex === false).then(function(packages) {
    var requests = [];

    // Gather each package information via npm
    _.each(packages.pkgs, function(p) {
      requests.push(gatherPackage(p.name));
    });

    // +TODO: separate tasks return promise
    q.all(requests).then(function(res) {
      packages.updates = {};

      // Update package information
      _.forEach(res, function(r) {
        var pkg = packages.pkgs[r.name];

        pkg.latest = r['dist-tags'].latest;
        pkg.updatable = semver.gt(pkg.latest, pkg.current);
        pkg.difftype = semverDiff(pkg.current, pkg.latest);

        // Show what it has different version
        if (opts.verbose) {
          console.log(chalk.green(pkg.name) + '@' + pkg.current,
            pkg.updatable ? ['can be updated to', chalk.red.bold(pkg.latest),
                            chalk.bold(pkg.difftype), 'version'].join(' ') : 'has no diff');
        }
      });

      // Update package.json
      updatePackages(packages);

      // and pass updated package.json to cb as plain text
      cb(null, packages);
    }).catch(function(err) {
      console.error(err);
      cb(err);
    });;
  });
}
