// NOTE: Do not add eslint as a dependency otherwise eslint-config-react-app will get pushed back in
// the module tree and will not be locatable. Just ignore the missing peer dependecy warning of the react-hooks plugin
const config = require('eslint-config-react-app');
const path = require('path');

config.extends = [
  'eslint:recommended',
  'plugin:import/recommended',
  'plugin:import/react',
  'plugin:react/recommended',
  'plugin:jsx-a11y/recommended',
];

// Setup the webpack import resolver for eslint-plugin-import
// webpack.config.js can be loaded independently of react-scripts but needs these _ENV vars
process.env.BABEL_ENV = process.env.BABEL_ENV || 'development';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
config.settings = config.settings || {};
config.settings['import/resolver'] = {
  webpack: { config: path.join(__dirname, 'node_modules/react-scripts/config/webpack.config.js') },
};

// Customize the rules and upgrade to errors
// Custom rules

Object.keys(config.rules).forEach(key => {
  if (config.rules[key] === 'warn') {
    config.rules[key] = 'error';
  } else if (Array.isArray(config.rules[key]) && config.rules[key][0] === 'warn') {
    config.rules[key][0] = 'error';
  }
});

module.exports = config;
