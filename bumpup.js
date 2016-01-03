'use strict';

var _ = require('lodash');
var NpmRegistryClient = require('npm-registry-client');
var q = require('q');
var fs = require('fs');
var path = require('path');
var semver = require('semver');
var semverDiff = require('semver-diff');
var chalk = require('chalk');
var async = require('async');
var jsdiff = require('diff');

var rx = {
  semver: /\d*\.\d*\.\d*/,
  pkg: /\"([\w\d-]*)\"\W*:\W\"([\d.^<>=~]*)\"/gi,
  tpl: /<%\s*(.*?)\s*%>/gi,
  dep: function (name) {
    return new RegExp('(\"' + name + '\")([^}]*)', 'gi');
  }
};

// Dependency, it has own package information
function Dependency(name, current, field) {
  this.name = name;
  this.current = current;
  this.field = field;
  this.latest = null;
  return this;
}

Dependency.prototype.isUpdated = function () {
  return this.latest ? semver.gt(this.latest, rx.semver.exec(this.current)[0]) : false;
};

Dependency.prototype.diffVersion = function () {
  return this.latest ? semverDiff(rx.semver.exec(this.current)[0], this.latest) : 'none';
};

// Manger for Dependencies, manage, write and logging
function Dependencies(opts) {
  this.npmClient = new NpmRegistryClient();
  this.deps = {};
  this.output = null;
  this.content = null;

  if (!opts.verbose) {
    this.npmClient.log.level = 'silent';
  }
}

Dependencies.prototype.read = function (input) {
  var deferred = q.defer();
  var _this = this;

  fs.readFile(path.resolve(input), function (err, data) {
    if (err) {
      deferred.reject(err);
      return;
    }

    try {
      var content = _this.content = data.toString();

      // remove underscore template code if template code exists.
      if (rx.tpl.test(content)) {
        content = content.replace(rx.tpl, '');
      }

      // extract dependencies field and value
      var depFields = ['dependencies', 'devDependencies'];

      _.forEach(depFields, function (d) {
        var depsContent = rx.dep(d).exec(content);
        var res = null;

        while ((res = rx.pkg.exec(depsContent)) !== null) {
          // Create a dependency with name, current and field string
          _this.deps[res[1]] = new Dependency(res[1], res[2], res[0]);
        }
      });

      deferred.resolve();
    } catch (e) {
      deferred.reject(e);
    }
  });

  return deferred.promise;
};

Dependencies.prototype.update = function () {
  var deferred = q.defer();
  var _this = this;

  async.map(_.pluck(_this.deps, 'name'), function (p, cb) {
    var params = {
      timeout: 1000
    };
    _this.npmClient.get('http://registry.npmjs.org/' + p, params, cb);
  }, function (err, res) {
    if (err) {
      deferred.reject(err);
      return;
    }

    // Update latest version of packages
    _.forEach(res, function (r) {
      _this.deps[r.name].latest = r['dist-tags'].latest;
    });

    // Generate content based on latest version
    _this.output = _this.content;

    _.forEach(_this.deps, function (d) {
      if (d.isUpdated()) {
        var latest = d.field.replace(rx.semver.exec(d.current)[0], d.latest);
        _this.output = _this.output.replace(d.field, latest);
      }
    });

    deferred.resolve();
  });

  return deferred.promise;
};

Dependencies.prototype.diff = function () {
  var diff = '';
  jsdiff.diffChars(this.content, this.output).forEach(function (part) {
    var color = part.added ? chalk.bgRed.bold : chalk.white;
    if (!part.removed) {
      diff += color(part.value);
    }
  });
  return diff;
};

Dependencies.prototype.changes = function () {
  var changes = [];
  _.forEach(this.deps, function (d) {
    changes.push(chalk.green(d.name) + '@' + rx.semver.exec(d.current)[0] +
          (d.isUpdated() ? [
            'can be updated to',
            chalk.red.bold(d.latest),
            chalk.bold(d.diffVersion()),
            'version'
          ].join(' ') : ' has no different versions'));
  });
  return changes;
};

module.exports = function (input, opts, cb) {
  var deps = new Dependencies(opts);

  deps.read(input).then(function () {
    return deps.update().then(function () {
      cb(null, deps);
    });
  }).catch(function (err) {
    cb(err);
  });
};
