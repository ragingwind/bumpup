const semverRegex = {
  test(version: string) {
    return /\d*\.\d*\.\d*/.test(version);
  },
  exec(version: string): string {
    return /\d*\.\d*\.\d*/.exec(version)?.pop() || '';
  },
};

const pkgRegex = {
  exec(pkg: string) {
    return /\\"([\w\d-]*)\\"\W*:\W\\"([\d.^<>=~]*)\\"/gi.exec(pkg);
  },
};

export { semverRegex, pkgRegex };
