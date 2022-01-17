import { readFileSync } from 'fs';
import semver from 'semver';
import semverDiff from 'semver-diff';
// @ts-ignore: no @type for this
import NpmRegistryClient from 'npm-registry-client';
// @ts-ignore: no @type for this
import { diffString } from 'json-diff';
import { semverRegex } from './regex';

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

type DependencyOptions = {
  overwrite: boolean;
};

const NpmRegiteryClientOptions = {
  log: {
    verbose() {},
    info() {},
    http() {},
  },
};

class Dependency {
  private npmClient = new NpmRegistryClient(NpmRegiteryClientOptions);

  constructor() {}

  async read(pkgPath: string): Promise<Dependencies> {
    try {
      const { dependencies, devDependencies } = JSON.parse(readFileSync(pkgPath).toString());
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

  async checkUpdates(dependencies: Dependencies): Promise<boolean> {
    const depUpdated = await this.updatePackgeInfo(dependencies['dependencies'] ?? {});
    const depDevUpdated = await this.updatePackgeInfo(dependencies['devDependencies'] ?? {});

    return depUpdated || depDevUpdated;
  }

  diff(pkgPath: string, deps: Dependencies) {
    const current = JSON.parse(readFileSync(pkgPath).toString());

    const diff = ['dependencies', 'devDependencies'].map((dep) =>
      diffString(current[dep], this.toJson(deps[dep] ?? {}))
    );

    console.log('dependencies', diff[0]);
    console.log('devDependencies', diff[1]);
  }

  toJson(deps: Packages) {
    return Object.entries(deps).reduce((json, [name, pkg]) => {
      json[name] = pkg.latest ?? pkg.version;
      return json;
    }, {} as any);
  }

  async bumpup(pkgPath: string, options: DependencyOptions = { overwrite: false }) {
    const deps: Dependencies = await this.read(pkgPath);

    if (await this.checkUpdates(deps)) {
      if (!options.overwrite) {
        this.diff(pkgPath, deps);
        // @TODO: confirm updated
      }

      // @TODO: update
    }
  }
}

export default Dependency;
