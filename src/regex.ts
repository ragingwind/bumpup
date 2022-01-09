// semver: /\d*\.\d*\.\d*/,
// var rx = {
//   pkg: /\\"([\w\d-]*)\\"\W*:\W\\"([\d.^<>=~]*)\\"/gi,
//   tpl: /<%\s*(.*?)\s*%>/gi,
//   dep: function (name) {
//     return new RegExp('(\\"' + name + '\\")([^}]*)', "gi");
//   },
// };

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
