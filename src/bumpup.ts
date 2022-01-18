import { readFileSync, writeFileSync } from 'fs';
import semver from 'semver';
import semverDiff from 'semver-diff';
// @ts-ignore
import NpmRegistryClient from 'npm-registry-client';
// @ts-ignore
import { diffString } from 'json-diff';
import { semverRegex } from './regex.js';

class Package {
  public updated: boolean = false;

  constructor(public name: string, public version: string, public field: string, public latest: string | null) {}

  checkUpdate(latest: string) {
    this.latest = latest;
    this.updated = this.latest ? semver.gt(this.latest, semverRegex.exec(this.version)) : false;
    return this.updated;
  }

  diff() {
    return this.latest ? semverDiff(semverRegex.exec(this.version), this.latest) : 'none';
  }

  toJson() {
    return {
      [this.name]: this.updated ? this.latest : this.version,
    };
  }
}

function migrateToPackage(pkg: any, field: string) {
  return Object.entries(pkg).reduce((packages, [name, version]) => {
    packages[name] = new Package(name, version as string, field, null);
    return packages;
  }, {} as any);
}

type Packages = { [name: string]: Package };

type Dependencies = {
  [name: string]: Packages;
};

const NpmRegiteryClientOptions = {
  log: {
    verbose() {},
    info() {},
    http() {},
  },
};

class Bumpup {
  private npmClient = new NpmRegistryClient(NpmRegiteryClientOptions);

  constructor() {}

  readPackage(pkgPath: string) {
    return JSON.parse(readFileSync(pkgPath).toString());
  }

  readDependencies(pkg: any): Dependencies {
    try {
      const { dependencies, devDependencies } = pkg;
      return {
        dependencies: { ...migrateToPackage(dependencies, 'dependencies') },
        devDependencies: {
          ...migrateToPackage(devDependencies, 'devDependencies'),
        },
      };
    } catch (e) {}

    return {
      dependencies: {},
      devDependencies: {},
    } as Dependencies;
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

  async updatePackgeInfo(packages: Packages): Promise<boolean> {
    const packageNames = Object.keys(packages);
    const npmPackages = (await Promise.all(packageNames.map((pkgName) => this.requestNpmInfo(pkgName)))) as any;

    let updateCount = 0;

    for (const npmPkg of npmPackages) {
      const pkg: Package | undefined = packages[npmPkg['name']];
      if (pkg && pkg.checkUpdate(npmPkg['dist-tags'].latest)) {
        updateCount++;
      }
    }

    return updateCount > 0;
  }

  async update(dependencies: Dependencies): Promise<boolean> {
    const depUpdated = await this.updatePackgeInfo(dependencies['dependencies'] ?? {});
    const depDevUpdated = await this.updatePackgeInfo(dependencies['devDependencies'] ?? {});

    return depUpdated || depDevUpdated;
  }

  diff(pkgPath: string, deps: Dependencies) {
    const current = this.readDependencies(pkgPath);
    const diff = Object.keys(current).map((dep) => diffString(current[dep], this.toJson(deps[dep] ?? {})));

    console.log('dependencies', diff[0]);
    console.log('devDependencies', diff[1]);
  }

  toJson(deps: Packages) {
    return Object.entries(deps).reduce((json, [name, pkg]) => {
      json[name] = pkg.latest ?? pkg.version;
      return json;
    }, {} as any);
  }

  async bumpup(
    pkgPath: string,
    outputPath: string = pkgPath,
    options: { diff: boolean; dryRun: boolean } = { diff: false, dryRun: false }
  ) {
    const pkg = this.readPackage(pkgPath);
    const current: Dependencies = this.readDependencies(pkg);

    if (await this.update(current)) {
      if (options.diff) {
        this.diff(pkgPath, current);
      }

      if (!options.dryRun) {
        Object.keys(current).forEach((dep) => {
          pkg[dep] = {
            ...pkg[dep],
            ...this.toJson(current[dep] ?? {}),
          };
        });

        writeFileSync(outputPath, JSON.stringify(pkg, null, 2));
      }
    }
  }
}

export default Bumpup;
