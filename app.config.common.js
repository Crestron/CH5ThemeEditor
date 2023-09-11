/**
 * webpack bundle config for
 * js,scss/sass/css and html files with
 * watch and browsersync
 *
 */

/*jslint es6 */
/*global document, require, exports, console, module, __dirname */
'use strict';

const path = require('path');
const glob = require('glob');
const TerserJSPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MergeIntoSingleFilePlugin = require('webpack-merge-and-include-globally');
const dotenv = require('dotenv').config().parsed;
const CopyPlugin = require('copy-webpack-plugin');
//config details
const nodeModules = `./node_modules/`;
const fontFiles = `ch5-font-files/`;
const distDir = 'app/dist/';
const cssBuild = `${distDir}css/`;
const basePath = path.resolve(__dirname);
const cssSourceFilePath = !!dotenv && !!dotenv.SASS_APP_CSS_SOURCE_FILE_PATH
  ? dotenv.SASS_APP_CSS_SOURCE_FILE_PATH : 'app/src/assets/css/*.css';

const crLibPath = !!dotenv && !!dotenv.SASS_APP_CR_COM_SOURCE_PATH
  ? dotenv.SASS_APP_CR_COM_SOURCE_PATH : './node_modules/@crestron/ch5-crcomlib/build_bundles/umd/';

const jsFilePath = !!dotenv && !!dotenv.SASS_APP_JS_SOURCE_FILE_PATH
  ? dotenv.SASS_APP_JS_SOURCE_FILE_PATH : 'app/src/assets/scripts/*.js';

const cssFileList = glob.sync(cssSourceFilePath);
const crComLib = glob.sync(`${crLibPath}cr-com-lib.js`);
const mainJs = glob.sync(jsFilePath);
const crLibJsList = [...crComLib, ...mainJs];
let createEntryList = function () {
  let filesObj = {};
  cssFileList.map((item) => {
    let itemArr = item.split("/");
    let fileName = itemArr[itemArr.length - 1].split('.')[0];
    let keyName = `${fileName}`;
    filesObj[keyName] = path.resolve(basePath, item);
  });
  return filesObj;
};
let entryList = createEntryList();

module.exports = {
  watch: true,
  entry: entryList,
  output: {
    filename: '[name].js',
    path: path.resolve(basePath, distDir)
  },
  resolve: {
    extensions: ['.scss', '.css', '.js']
  },
  optimization: {
    minimizer: [new OptimizeCSSAssetsPlugin(), new TerserJSPlugin()]
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader
          },
          'css-loader',
        ]
      },
      {
        test: /\.(html)$/,
        use: {
          loader: 'html-loader',
          options: {
            attrs: [':data-src'],
            root: path.resolve(__dirname, 'app')
          }
        }
      }
    ]
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].css'
    }),
    new CopyPlugin([
      {
        from: path.resolve(basePath, `${nodeModules}@fortawesome/fontawesome-free/webfonts/*`),
        to: path.resolve(basePath, `output/webfonts`),
        flatten: true,
        force: true
      },
      {
        from: path.resolve(basePath, `${fontFiles}/*`),
        to: path.resolve(basePath, 'output/fonts'),
        flatten: true,
        force: true
      }
    ]),
    new MergeIntoSingleFilePlugin({
      files: [
        {
          src: crLibJsList,
          dest: 'cr-com-lib.js'
        }
      ]
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      inject: false,
      //serve  html content to "index.html"
      template: './app/src/index.html'
    })
  ]
};
