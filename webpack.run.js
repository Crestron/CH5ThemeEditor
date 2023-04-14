
const path = require('path');
const _ = require('lodash');
const merge = require('webpack-merge');
const CopyPlugin = require('copy-webpack-plugin');
const fs = require('fs');
const common = require('./webpack.build.js');
const glob = require('glob');
let dotenv = require('dotenv').config().parsed;

const isDevMode = ["--watch", "--watchmode"];
//Ignore env inputs if app is running.
dotenv = !!process.argv[4] && isDevMode.includes(process.argv[4]) ? undefined : dotenv;
const fontsSourceFilepath = !!dotenv && !!dotenv.SOURCE_FONTS_FILE_PATH ? dotenv.SOURCE_FONTS_FILE_PATH : 'output/fonts/*';
const fontsDestinationFilepath = !!dotenv && !!dotenv.DESTINATION_FONTS_FILE_PATH ? dotenv.DESTINATION_FONTS_FILE_PATH : './app/dist/fonts/';
const webFontsSourceFilepath = !!dotenv && !!dotenv.SOURCE_WEBFONTS_FILE_PATH ? dotenv.SOURCE_WEBFONTS_FILE_PATH : 'output/webfonts/*';
const webFontsDestinationFilepath = !!dotenv && !!dotenv.DESTINATION_WEBFONTS_FILE_PATH ? dotenv.DESTINATION_WEBFONTS_FILE_PATH : './app/dist/webfonts/';
const basePath = path.resolve(__dirname);
const sourceFilePath = !!dotenv && !!dotenv.SOURCE_THEMES_FILE_PATH ? dotenv.SOURCE_THEMES_FILE_PATH : 'output/themes/**/*';
const fontAwesomeFilePath = "./node_modules/@fortawesome/fontawesome-free";
const materialIconsFilePath = "./node_modules/@material-icons/font";
const sgIconsPath = "./sg-icons";

// get the all theme list
const manifestSourceFilePath = "./app.manifest.json";
const manifestDestFilePath = "./app/dist/manifest/";
const themeList = {};
themeList.themeName = glob.sync('output/themes/*-theme.css');

const jsonData = JSON.stringify(themeList, null, 4);
fs.writeFileSync(manifestSourceFilePath, jsonData);

let destinationFilePath = !!dotenv && !!dotenv.DESTINATION_THEMES_FILE_PATH ? dotenv.DESTINATION_THEMES_FILE_PATH : './app/dist/css/';
let fontAwesomeDestinationFilePath = !!dotenv && !!dotenv.DESTINATION_THEMES_FILE_PATH ? dotenv.DESTINATION_THEMES_FILE_PATH : './app/dist/css/font-awesome/';
let materialIconsDestinationFilePath = !!dotenv && !!dotenv.DESTINATION_THEMES_FILE_PATH ? dotenv.DESTINATION_THEMES_FILE_PATH : './app/dist/css/material-icons/';
let sgIconsDestinationFilePath = !!dotenv && !!dotenv.DESTINATION_THEMES_FILE_PATH ? dotenv.DESTINATION_THEMES_FILE_PATH : './app/dist/css/sg-icons/';

const searches = ['--outputpath'];
const transformURL = function (cliUrl) {
  let cliDestPath = {};
  cliUrl.map((item) => {
    let [cliKey, cliValue] = item.split('=');
    cliKey = cliKey.replace(/^-+|'+$/g, "").trim();
    cliValue = cliValue.replace(/^\'|\'+$/g, "").trim();
    cliDestPath[cliKey] = cliValue;
  });
  return cliDestPath;
};

const pathMatches = _.filter(process.argv, (item) => { return item.indexOf(searches[0]) !== -1 });
if (pathMatches.length) {
  let processArgv = transformURL(pathMatches);
  destinationFilePath = !processArgv['outputpath'] ? destinationFilePath : processArgv.outputpath;
  fontAwesomeDestinationFilePath = !processArgv['outputpath'] ? fontAwesomeDestinationFilePath : processArgv.outputpath + '/font-awesome/';
  materialIconsDestinationFilePath = !processArgv['outputpath'] ? materialIconsDestinationFilePath : processArgv.outputpath + '/material-icons/';
  sgIconsDestinationFilePath = !processArgv['outputpath'] ? sgIconsDestinationFilePath : processArgv.outputpath + '/sg-icons/';
}

module.exports = merge(common, {
  mode: !!process.argv[4] && isDevMode.includes(process.argv[4]) ? 'development' : 'production',
  plugins: [
    new CopyPlugin([
      {
        from: path.resolve(basePath, sourceFilePath),
        to: path.resolve(basePath, destinationFilePath),
        flatten: true,
        force: true
      },
      {
        from: path.resolve(basePath, fontsSourceFilepath),
        to: path.resolve(basePath, fontsDestinationFilepath),
        flatten: true,
        force: true
      },
      {
        from: path.resolve(basePath, fontAwesomeFilePath + "/css/all.css"),
        to: path.resolve(basePath, fontAwesomeDestinationFilePath + "/css/all.css"),
        flatten: true,
        force: true
      },
      {
        from: path.resolve(basePath, fontAwesomeFilePath + "/webfonts/*"),
        to: path.resolve(basePath, fontAwesomeDestinationFilePath + "/webfonts"),
        flatten: true,
        force: true
      },
      {
        from: path.resolve(basePath, materialIconsFilePath + "/css/all.css"),
        to: path.resolve(basePath, materialIconsDestinationFilePath + "/css/all.css"),
        flatten: true,
        force: true
      },
      {
        from: path.resolve(basePath, materialIconsFilePath + "/font/*"),
        to: path.resolve(basePath, materialIconsDestinationFilePath + "/font"),
        flatten: true,
        force: true
      },
      {
        from: path.resolve(basePath, sgIconsPath + "/css/all.css"),
        to: path.resolve(basePath, sgIconsDestinationFilePath + "/css/all.css"),
        flatten: true,
        force: true
      },
      {
        from: path.resolve(basePath, sgIconsPath + "/svgs/icons/*"),
        to: path.resolve(basePath, sgIconsDestinationFilePath + "/svgs/icons"),
        flatten: true,
        force: true
      },
      {
        from: path.resolve(basePath, sgIconsPath + "/svgs/media-transports/accents/*"),
        to: path.resolve(basePath, sgIconsDestinationFilePath + "/svgs/media-transports/accents"),
        flatten: true,
        force: true
      },
      {
        from: path.resolve(basePath, sgIconsPath + "/svgs/media-transports/light/*"),
        to: path.resolve(basePath, sgIconsDestinationFilePath + "/svgs/media-transports/light"),
        flatten: true,
        force: true
      },
      {
        from: path.resolve(basePath, sgIconsPath + "/svgs/media-transports/dark/*"),
        to: path.resolve(basePath, sgIconsDestinationFilePath + "/svgs/media-transports/dark"),
        flatten: true,
        force: true
      },
      {
        from: path.resolve(basePath, webFontsSourceFilepath),
        to: path.resolve(basePath, webFontsDestinationFilepath),
        flatten: true,
        force: true
      },
      {
        from: path.resolve(basePath, manifestSourceFilePath),
        to: path.resolve(basePath, manifestDestFilePath),
        flatten: true,
        force: true
      }
    ])
  ]
});