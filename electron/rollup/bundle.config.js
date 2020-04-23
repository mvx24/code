const resolve = require('@rollup/plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const css = require('rollup-plugin-css-only');
const commonjs = require('@rollup/plugin-commonjs');
const commonjsRequire = require('./plugin-commonjs-require');
const json = require('@rollup/plugin-json');
const { terser } = require('rollup-plugin-terser');
const babelrc = require('../babel.config.js')();
const path = require('path');
const { builtinModules } = require('module');

const inputPath = path.resolve(__dirname, '../src/index.js');
const outputPath = path.resolve(__dirname, '../build/bundle.js');
const dynamicModules = new Array('electron', ...builtinModules);
const commonJsModules = [
  'prop-types',
  'react',
  'react-dom',
  'react-is',
];

// Update the preset-env to not build modules
// and transpile all features by ignoring browserslist so that uglify works
babelrc.presets.forEach(([name, options]) => {
  if (name === '@babel/preset-env') {
    options.modules = false;
    options.ignoreBrowserslistConfig = true;
  }
});

module.exports = {
  context: 'window',
  input: inputPath,
  output: {
    file: outputPath,
    format: 'iife',
    sourcemap: false,
    globals: Object.fromEntries(dynamicModules.map(name => [name, `require("${name}")`])),
  },
  external: dynamicModules,
  plugins: [
    resolve({ browser: true, preferBuiltins: true }),
    babel(
      Object.assign(babelrc, {
        babelrc: false,
        exclude: ['node_modules/**', 'lib/**'],
      }),
    ),
    json({ compact: true }),
    css({ output: 'build/bundle.css' }),
    commonjs({
      // Libraries that export an object instead of named exports
      // Rollup doesn't handle the import { x } from 'lib'; properly unless named
      namedExports: Object.fromEntries(
        commonJsModules.map(name => [name, Object.keys(require(name))]),
      ),
      ignore: dynamicModules,
      sourcemap: false,
    }),
    commonjsRequire(),
    terser({ sourcemap: false }),
  ],
};
