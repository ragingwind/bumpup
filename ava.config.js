export default {
  extensions: {
    ts: 'module'
  },
  nodeArguments: [
    '--no-warnings',
    '--loader=ts-node/esm',
    '--experimental-specifier-resolution=node'
  ],
  files: [
    'test/**/*.ts'
  ]
};
