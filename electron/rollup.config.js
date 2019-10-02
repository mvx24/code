const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const css = require('rollup-plugin-css-only');
const commonjs = require('rollup-plugin-commonjs');
const json = require('rollup-plugin-json');
const { terser } = require('rollup-plugin-terser');
const pkg = require('./package.json');
const babelrc = require('./babel.config.js')();

// Update the preset-env to not build modules
// and transpile all features by ignoring browserslist so that uglify works
babelrc.presets.forEach(([name, options]) => {
  if (name === '@babel/preset-env') {
    options.modules = false;
    options.ignoreBrowserslistConfig = true;
  }
});

const getNamedExports = lib => {
  // Get all of the keys exported from a CJS library object
  try {
    return Object.keys(require(lib));
  } catch (e) {
    return [];
  }
};

module.exports = {
  input: 'src/index.js',
  output: {
    file: 'build/bundle.js',
    format: 'iife',
    name: pkg.name,
    sourcemap: false,
  },
  plugins: [
    resolve({ preferBuiltins: true }),
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
      namedExports: {
        react: getNamedExports('react'),
        'react-dom': getNamedExports('react-dom'),
      },
    }),
    terser({ sourcemap: false }),
  ],
};
