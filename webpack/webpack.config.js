/**
 * A webpack config script with babel, postcss, css modules,
 * file loaders and webpack-symmetric backend proxy.
 */

const fs = require('fs');
const path = require('path');

const dotenv = require('dotenv');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { createBackendProxy } = require('webpack-symmetric');

// Paths configuration
const srcPath = path.resolve(__dirname, 'src');
const buildPath = path.resolve(__dirname, 'build');
const indexPath = path.resolve(__dirname, './public/index.html');
const staticPath = path.resolve(__dirname, './public');

// Proxy and production configuration
// Configure a development backend under .env.development, otherwise use productionBackend here
const productionOrigin = 'https://my-app.com';
const productionBackend = '';
const backendPaths = [];
const backendSubpaths = [];

// Loaders
const babelLoader = { loader: 'babel-loader' };
const styleLoader = { loader: 'style-loader' };
const cssLoader = { loader: 'css-loader' };
const cssModuleLoader = {
  loader: 'css-loader',
  options: {
    camelCase: true,
    modules: true,
  },
};
const postCssLoader = {
  loader: 'postcss-loader',
  options: {
    ident: 'postcss',
    plugins: [
      require('postcss-flexbugs-fixes'),
      require('postcss-preset-env')({
        autoprefixer: {
          flexbox: 'no-2009',
        },
        stage: 3,
      }),
    ],
  },
};
const fileLoader = {
  loader: 'file-loader',
  options: {
    name: () => `media/[name].${process.env.NODE_ENV === 'production' ? '[hash:8].' : ''}[ext]`,
  },
};

// Plugins
const htmlPlugin = fs.existsSync(indexPath)
  ? new HtmlWebpackPlugin({
      template: indexPath,
      templateParameters: {},
    })
  : null;
const copyPlugin = fs.existsSync(staticPath)
  ? new CopyPlugin([{ from: path.relative(__dirname, staticPath), to: '' }])
  : null;

// Assemble rules and plugins
const rules = [
  {
    test: /\.js$/,
    exclude: /node_modules/,
    use: [babelLoader],
  },
  {
    test: /\.css$/,
    exclude: /\.module\.css$/,
    use: [styleLoader, cssLoader, postCssLoader],
  },
  {
    test: /\.module\.css$/,
    use: [styleLoader, cssModuleLoader, postCssLoader],
  },
  {
    test: /\.(svg|png|jpe?g|gif|bmp|web[pm]|mp[34]|m4a|wav)$/,
    use: [fileLoader],
  },
];
const plugins = [htmlPlugin, copyPlugin].filter(Boolean);

module.exports = (env, argv) => {
  const { mode } = argv;
  let devServer;
  let devtool;
  let output;

  // Setup process.env from the mode and env files
  if (!process.env.NODE_ENV) process.env.NODE_ENV = argv.mode;
  dotenv.config(path.resolve(__dirname, `.env.${mode}.local`));
  dotenv.config(path.resolve(__dirname, `.env.${mode}`));
  dotenv.config(path.resolve(__dirname, `.env.local`));
  dotenv.config();

  // Development vs Production configurations
  if (mode === 'development') {
    devtool = 'eval-source-map';
    output = {
      chunkFilename: 'js/[id].js',
      filename: 'js/[name].js',
      pathinfo: true,
      publicPath: '/',
    };

    // Development plugins
    plugins.push(
      new webpack.HotModuleReplacementPlugin(),
      new MiniCssExtractPlugin({
        chunkFilename: 'css/[id].css',
        filename: 'css/[name].css',
      }),
    );

    // Development server setup
    const proxy = createBackendProxy({
      backend: process.env.BACKEND || productionBackend,
      paths: backendPaths,
      subpaths: backendSubpaths,
    });
    // Always use SSL, but proxy may be disabled if a backend is not available
    devServer = {
      stats: 'errors-only',
      historyApiFallback: true,
      hot: true,
      contentBase: srcPath,
      allowedHosts: ['localhost', '.local'],
      disableHostCheck: process.env.DANGEROUSLY_DISABLE_HOST_CHECK === 'true',
      host: process.env.HOST || 'localhost',
      port: process.env.PORT || '3000',
      https: proxy.ssl,
      proxy: proxy.target ? { '/': proxy } : undefined,
    };
    if (process.platform === 'darwin') {
      devServer.after = () => {
        const childProcess = require('child_process');
        const host = devServer.host === '0.0.0.0' ? 'localhost' : devServer.host;
        const { port } = devServer;
        childProcess.execSync(`open -a "Google Chrome" "https://${host}:${port}"`);
      };
    }
  } else if (mode === 'production') {
    devtool = 'source-map';
    output = {
      chunkFilename: 'js/[name].[chunkhash:8].js',
      filename: 'js/[name].[chunkhash:8].js',
      path: buildPath,
      pathinfo: false,
      publicPath: `${productionOrigin}/`,
    };

    // Production plugins
    const bundleAnalyzerPlugin = new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
    });
    const miniCssExtractPlugin = new MiniCssExtractPlugin({
      chunkFilename: 'css/[id].[contenthash:8].css',
      filename: 'css/[name].[contenthash:8].css',
    });
    plugins.push(bundleAnalyzerPlugin, miniCssExtractPlugin);

    // Replace style-loader with MiniCSSExtractPlugin.loader to make CSS chunks match JS chunks
    Object.keys(styleLoader).forEach(key => delete styleLoader[key]);
    styleLoader.loader = MiniCssExtractPlugin.loader;

    // When building an SDK for third-party sites with strict no inlining CSP
    if (process.env.COMBINED_OUTPUT === 'true') {
      plugins.push(new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }));
      output.filename = 'sdk/[name].js';
      miniCssExtractPlugin.options.filename = 'sdk/[name].css';
    }

    // Turn on HTML minification
    if (htmlPlugin) {
      htmlPlugin.options.minify = {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      };
    }

    // Turn on css minification but allow css-loader to handle imports
    postCssLoader.options.plugins.push(require('postcss-clean')({ inline: false }));
  } else {
    // The eslint webpack resolver sets no mode
    // set the bare minimum required to return
    output = { publicPath: '/' };
  }

  // Gather env variables for the html and define plugins
  const envVars = { NODE_ENV: mode, PUBLIC_URL: output.publicPath };
  Object.keys(process.env).forEach(key => {
    if (!key.indexOf('WEBPACK_VAR_')) envVars[key] = process.env[key];
  });
  const envVarsJs = {};
  Object.keys(envVars).forEach(key => {
    envVarsJs[key] = JSON.stringify(envVars[key]);
  });

  // Set the html and define plugin variables
  if (htmlPlugin) {
    Object.assign(htmlPlugin.options.templateParameters, envVars);
    htmlPlugin.options.templateParameters.url = pathname => path.join(output.publicPath, pathname);
  }
  plugins.push(new webpack.DefinePlugin({ 'process.env': envVarsJs }));

  // The base config
  const config = {
    devServer,
    devtool,
    module: { rules },
    output,
    plugins,
    resolve: { modules: ['node_modules', 'src'] },
  };

  return config;
};
