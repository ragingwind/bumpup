import path from 'path';
import { fileURLToPath } from 'url';
import meow from 'meow';
import Bumpup from './bumpup.js';

var cli = meow(
  `
  Usage
      bumpup package.json [OPTIONS]
      bumpup package.json --diff --output new-package.json

  Options
      --output: Output file name, If no file name, the package.json will be overwrite
      --diff: Show what packages are changed
      --dryRun: Do not write to package.json`,
  {
    importMeta: import.meta,
    flags: {
      output: {
        type: 'string',
        default: '',
      },
      diff: {
        type: 'boolean',
        default: false,
      },
      dryRun: {
        type: 'boolean',
        default: false,
      },
    },
  }
);

if (cli.input.length === 0) {
  cli.showHelp(-1);
}

const resolve = (target: string) => path.resolve(path.dirname(fileURLToPath(import.meta.url)), target);

const pkgName = resolve(cli.input[0] as string);
const output = resolve(cli.flags.output ?? pkgName);
const { diff, dryRun } = cli.flags;

const bumpup = new Bumpup();
await bumpup.bumpup(pkgName, output, { diff, dryRun });

// const dest = d.readPackage(resolve('../fixtures/package-bumped.json'));

// bumpup(cli.input[0], cli.flags, function (err, deps) {
//   var output = path.resolve(cli.flags.output ? cli.flags.output : cli.input[0]);

//   if (err) {
//     console.log("bumpup got an error", err);
//     process.exit(-1);
//   }

//   // Show what packages are changed
//   if (cli.flags.verbose) {
//     console.log(deps.changes().join("\n"));
//   }

//   // Show what is changed in red color
//   if (cli.flags.diff) {
//     process.stderr.write(deps.diff());
//   }

//   // Write a file updated
//   if (fs.existsSync(output)) {
//     inquirer.prompt(
//       {
//         type: "confirm",
//         name: "overwrite",
//         message: "The output file already exists. Overwrite?",
//       },
//       function (answers) {
//         if (answers.overwrite) {
//           fs.writeFileSync(output, deps.output);
//         }
//       }
//     );
//   } else {
//     fs.writeFileSync(output, deps.output);
//   }
// });
