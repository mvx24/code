const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const pkg = require('./package.json');
const babelrc = require('./babel.config.js')();
babelrc.presets[0][1].modules = false;

module.exports = {
  input: 'src/index.js',
  output: {
    file: pkg.main,
    format: 'umd',
    name: pkg.name,
    sourcemap: true,
  },
  plugins: [
    resolve(),
    babel(
      Object.assign(babelrc, {
        babelrc: false,
        exclude: 'node_modules/**',
      }),
    ),
  ],
};
