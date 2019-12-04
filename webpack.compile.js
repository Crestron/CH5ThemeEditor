/**
 * copy css unminified files into destination folder
 */
const path = require('path');
const merge = require('webpack-merge');
const common = require('./webpack.build.js');
const CopyPlugin = require('copy-webpack-plugin');
const dotenv = require('dotenv').config().parsed;
const basePath = path.resolve(__dirname);
// config details
const sourceFilePath = !!dotenv && !!dotenv.SOURCE_FILE_PATH ? dotenv.SOURCE_FILE_PATH : 'output/themes/*.css';
const destinationFilePath = !!dotenv && !!dotenv.DESTINATION_COMPILE_FILE_PATH
  ? dotenv.DESTINATION_COMPILE_FILE_PATH : './app/src/assets/css';

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  plugins: [
    new CopyPlugin([{
      from: path.resolve(basePath, sourceFilePath),
      to: path.resolve(basePath, destinationFilePath),
      flatten: true,
      force: true
    }])
  ]
});