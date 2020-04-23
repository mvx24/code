// Fix a bug where "require" is transformed by @rollup/plugin-commonjs into an error-printing function "commonjsRequire"
// making "require.cache", etc undefined, such as - https://github.com/sindresorhus/conf/blob/master/index.js#L22
module.exports = () => ({
  renderChunk: code => code.replace(/commonjsRequire\./g, 'require.'),
});
