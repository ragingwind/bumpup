import { readFileSync } from 'fs';
import semver from 'semver';
import semverDiff from 'semver-diff';
// @ts-ignore: no @type for this
import NpmRegistryClient from 'npm-registry-client';
import { semverRegex } from './regex';

class Package {
  constructor(public name: string, public version: string, public field: string, public latest: string | null) {}

  hasUpdates() {
    return this.latest ? semver.gt(this.latest, semverRegex.exec(this.version)) : false;
  }

  diff() {
    return this.latest ? semverDiff(semverRegex.exec(this.version), this.latest) : 'none';
  }
}

function migrateToPackage(pkg: any, field: string) {
  return Object.entries(pkg).reduce((packages, [name, version]) => {
    packages[name] = new Package(name, version as string, field, null);
    return packages;
  }, {} as any);
}

class Dependency {
  private npmClient = new NpmRegistryClient();

  constructor() {
    this.npmClient.log.level = 'silent';
  }

  async read(pkgPath: string) {
    try {
      const { dependencies, devDependencies } = JSON.parse(readFileSync(pkgPath).toString());
      return Object.assign(
        {},
        migrateToPackage(dependencies, 'dependencies'),
        migrateToPackage(devDependencies, 'devDependencies')
      );
    } catch (e) {}

    return [];
  }

  async requestNpmInfo(pkgName: string) {
    return new Promise((resolve, reject) => {
      this.npmClient.get(
        `http://registry.npmjs.org/${pkgName}`,
        {
          timeout: 5000,
        },
        (err: any, res: unknown) => (err ? reject() : resolve(res))
      );
    });
  }

  async bumpup(pkgPath: string) {
    const packages = await this.read(pkgPath);
    const packageNames = Object.keys(packages);
    if (packageNames.length > 0) {
      const npmPackages = await Promise.all(packageNames.map((pkgName) => this.requestNpmInfo(pkgName)));

      for (const npmPkg of npmPackages as any) {
        packages[npmPkg.name].latest = npmPkg['dist-tags']?.latest;
      }

      console.log(packages);
    }
  }
}

// // Manger for Dependencies, manage, write and logging
// function Dependencies(opts) {
//   this.npmClient = new NpmRegistryClient();
//   this.deps = {};
//   this.output = null;
//   this.content = null;

//   if (!opts.verbose) {
//     this.npmClient.log.level = "silent";
//   }
// }

// Dependencies.prototype.read = function (input) {
//   var deferred = q.defer();
//   var _this = this;

//   fs.readFile(path.resolve(input), function (err, data) {
//     if (err) {
//       deferred.reject(err);
//       return;
//     }

//     try {
//       var content = (_this.content = data.toString());

//       // remove underscore template code if template code exists.
//       if (rx.tpl.test(content)) {
//         content = content.replace(rx.tpl, "");
//       }

//       // extract dependencies field and value
//       var depFields = ["dependencies", "devDependencies"];

//       _.forEach(depFields, function (d) {
//         var depsContent = rx.dep(d).exec(content);
//         var res = null;

//         while ((res = rx.pkg.exec(depsContent)) !== null) {
//           // Create a dependency with name, current and field string
//           _this.deps[res[1]] = new Dependency(res[1], res[2], res[0]);
//         }
//       });

//       deferred.resolve();
//     } catch (err) {
//       deferred.reject(err);
//     }
//   });

//   return deferred.promise;
// };

// Dependencies.prototype.update = function () {
//   var deferred = q.defer();
//   var _this = this;

//   async.map(
//     _.pluck(_this.deps, "name"),
//     function (p, cb) {
//       var params = {
//         timeout: 1000,
//       };
//       _this.npmClient.get("http://registry.npmjs.org/" + p, params, cb);
//     },
//     function (err, res) {
//       if (err) {
//         deferred.reject(err);
//         return;
//       }

//       // Update latest version of packages
//       _.forEach(res, function (r) {
//         _this.deps[r.name].latest = r["dist-tags"].latest;
//       });

//       // Generate content based on latest version
//       _this.output = _this.content;

//       _.forEach(_this.deps, function (d) {
//         if (d.isUpdated()) {
//           var latest = d.field.replace(rx.semver.exec(d.current)[0], d.latest);
//           _this.output = _this.output.replace(d.field, latest);
//         }
//       });

//       deferred.resolve();
//     }
//   );

//   return deferred.promise;
// };

// Dependencies.prototype.diff = function () {
//   var diff = "";
//   jsdiff.diffChars(this.content, this.output).forEach(function (part) {
//     var color = part.added ? chalk.bgRed.bold : chalk.white;
//     if (!part.removed) {
//       diff += color(part.value);
//     }
//   });
//   return diff;
// };

// Dependencies.prototype.changes = function () {
//   var changes = [];
//   _.forEach(this.deps, function (d) {
//     changes.push(
//       chalk.green(d.name) +
//         "@" +
//         rx.semver.exec(d.current)[0] +
//         (d.isUpdated()
//           ? [
//               "can be updated to",
//               chalk.red.bold(d.latest),
//               chalk.bold(d.diffVersion()),
//               "version",
//             ].join(" ")
//           : " has no different versions")
//     );
//   });
//   return changes;
// };

export default Dependency;
