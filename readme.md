# bumpup [![Build Status](https://travis-ci.org/ragingwind/bumpup.svg?branch=master)](https://travis-ci.org/ragingwind/bumpup)

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

- regex: Specify how to parse the package.json by regex. if not set? reading by json is default
- output: Output file name, If no file name, the package.json will be overwrite
- verbose: Show what is going on

## License

MIT © [ragingwind](http://ragingwind.me)
