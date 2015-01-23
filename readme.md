# bumpup

> You can use for your npm packages or Yeoman package.json template that needed to bumpup version of dependences

## Install

```sh
$ npm install --save bumpup
```


## Usage

```js
var bumpup = require('bumpup');

bumpup('package.json', options, function(err, packages) {
    // write or diff
});
```

```sh
# bump up to latest version
bumpup package.json
bumpup _package.json --regex --verbose
bumpup package.json --output new-package.json
```

## Options

- regex: Choose the way of parse the package.json. json is default
- output: Output file name, If given no filename for output then source file will be overwritten
- verbose: Show what is going on

## License

MIT © [ragingwind](http://ragingwind.me)
