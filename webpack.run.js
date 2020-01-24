
const path = require('path');
const _ = require('lodash');
const merge = require('webpack-merge');
const CopyPlugin = require('copy-webpack-plugin');
const fs = require('fs');
const common = require('./webpack.build.js');
const WriteJsonPlugin = require('write-json-webpack-plugin');
const glob = require('glob');
let dotenv = require('dotenv').config().parsed;

const isDevMode = ["--watch","--watchmode"];
//Ignore env inputs if app is running.
dotenv = !!process.argv[4] && isDevMode.includes(process.argv[4]) ? undefined : dotenv;
const fontsSourceFilepath = !!dotenv && !!dotenv.SOURCE_FONTS_FILE_PATH ? dotenv.SOURCE_FONTS_FILE_PATH : 'output/fonts/*';
const fontsDestinationFilepath = !!dotenv && !!dotenv.DESTINATION_FONTS_FILE_PATH ? dotenv.DESTINATION_FONTS_FILE_PATH : './app/dist/fonts/';
const webFontsSourceFilepath = !!dotenv && !!dotenv.SOURCE_WEBFONTS_FILE_PATH ? dotenv.SOURCE_WEBFONTS_FILE_PATH : 'output/webfonts/*';
const webFontsDestinationFilepath = !!dotenv && !!dotenv.DESTINATION_WEBFONTS_FILE_PATH ? dotenv.DESTINATION_WEBFONTS_FILE_PATH : './app/dist/webfonts/';
const basePath = path.resolve(__dirname);
const sourceFilePath = !!dotenv && !!dotenv.SOURCE_THEMES_FILE_PATH ? dotenv.SOURCE_THEMES_FILE_PATH : 'output/themes/*.css';

// get the all theme list
const manifestSourceFilePath = "./app.manifest.json";
const manifestDestFilePath = "./app/dist/manifest/";
const themeList = {};
themeList.themeName = glob.sync('output/themes/*-theme.css');
const jsonData = JSON.stringify(themeList, null, 4);
fs.writeFileSync(manifestSourceFilePath,jsonData);


let destinationFilePath = !!dotenv && !!dotenv.DESTINATION_THEMES_FILE_PATH
  ? dotenv.DESTINATION_THEMES_FILE_PATH
  : './app/dist/css/';

const searches = ['--outputpath'];
let transformURL = function (cliUrl) {
  let cliDestPath = {};
  cliUrl.map((item) => {
    let [cliKey, cliValue] = item.split('=');
    cliKey = cliKey.replace(/^-+|'+$/g, "").trim();
    cliValue = cliValue.replace(/^\'|\'+$/g, "").trim();
    cliDestPath[cliKey] = cliValue;
  });
  return cliDestPath;
};

let pathMatches = _.filter(process.argv, (item) => { return item.indexOf(searches[0]) !== -1});

if (pathMatches.length) {
  let processArgv = transformURL(pathMatches);
  destinationFilePath = !processArgv['outputpath'] ? destinationFilePath : processArgv.outputpath;
}
module.exports = merge(common, {
  mode: !!process.argv[4] && isDevMode.includes(process.argv[4]) ? 'development' : 'production',
  plugins: [
    new CopyPlugin([
      {
        from: path.resolve(basePath, sourceFilePath),
        //Relative path for destination folder
        to: path.resolve(basePath, destinationFilePath),
        flatten: true,
        force: true
      },
      {
        from: path.resolve(basePath, fontsSourceFilepath),
        //Relative path for destination folder
        to: path.resolve(basePath, fontsDestinationFilepath),
        flatten: true,
        force: true
      },
      {
        from: path.resolve(basePath, webFontsSourceFilepath),
        //Relative path for destination folder
        to: path.resolve(basePath, webFontsDestinationFilepath),
        flatten: true,
        force: true
      },
      {
        from: path.resolve(basePath, manifestSourceFilePath),
        //Relative path for destination folder
        to: path.resolve(basePath, manifestDestFilePath),
        flatten: true,
        force: true
      }
    ]),
  ]
});