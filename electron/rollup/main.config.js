const resolve = require('@rollup/plugin-node-resolve');
const json = require('@rollup/plugin-json');
const { terser } = require('rollup-plugin-terser');
const commonjs = require('@rollup/plugin-commonjs');
const path = require('path');
const { builtinModules } = require('module');

const inputPath = path.resolve(__dirname, '../main.js');
const outputPath = path.resolve(__dirname, '../build/main.js');

// Include development-only packages that never get used in production
// Also, electron-reload does not rollup because it require()s binary files
const dynamicModules = new Array('electron', 'electron-reload', ...builtinModules);

module.exports = {
  context: 'global',
  input: inputPath,
  output: {
    file: outputPath,
    format: 'iife',
    sourcemap: false,
    globals: dynamicModules.map(name => [name, `require("${name}")`]),
  },
  external: dynamicModules,
  plugins: [
    resolve({ preferBuiltins: true }),
    json({ compact: true }),
    commonjs({
      ignore: dynamicModules,
      sourceMap: false,
    }),
    terser({ sourcemap: false }),
  ],
};
