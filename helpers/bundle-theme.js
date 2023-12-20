// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

const path = require('path'),
fs = require('fs'),
logging = require('./logging'),
NOTICE_MESSAGE = require('./notice-message');

(function(path, fs, logging) {
  const nodeSass = require('sass'),
    basePath = path.resolve(__dirname + '/../'),
    themesPath = basePath + '/themes';
    
  let theme = process.argv[2],
      copy = process.argv[3];
      outputPath = basePath + '/dist/';

  logging.loading('Searching for the theme');
  
  if(theme !== undefined && theme === 'all') {
    const allThemes = fs.readdirSync(themesPath);

    allThemes.forEach(themeName => {
      bundleTheme(themeName);
    });
    
    return;
  }
  
  bundleTheme(theme);

  function copyAssetsTo(basePath, copyPath, filePath, fileName) {
    
    if(copyPath !== undefined) {

      const foreignDirectory = 'crestron-components-assets';

      if(fs.existsSync(path.resolve(basePath, copyPath))) {
        
        if(!fs.existsSync(path.resolve(basePath, copyPath, foreignDirectory))) {
          fs.mkdirSync(path.resolve(basePath, copyPath, foreignDirectory));
        }
        
        fs.copyFileSync(path.resolve('basePath', filePath, fileName), path.resolve(copyPath, foreignDirectory, fileName));  
        logging.message(`Theme ${fileName} will be copied into ${copyPath}/${foreignDirectory}/${fileName}`);

      } else {
        logging.error('The path where you want to copy the assets doesn\'t exists');
        return;
      }
    }
  }

  function bundleTheme(theme) {

    let themePath, 
      themeFile, 
      fullPath;

    if(theme === undefined) {
      logging.message('The contrast theme is gonna be bundled. In order to bundle a custom theme run the following command: npm run bundle-theme your-theme-name');
      theme = 'high-contrast';
    }

    themePath = themesPath + '/' + theme;
    themeFile = themePath + '/' + theme + '-theme.scss';
    fullPath = themePath + '/' + themeFile;

    if(!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath);
    }

    if(!fs.existsSync(path.resolve(outputPath, 'themes/'))) {
      fs.mkdirSync(path.resolve(outputPath, 'themes'));
    }
    
    if(!fs.existsSync(themePath)) {
      logging.error(`Theme ${theme} doesn't exists`);
      return;
    }
    
    logging.success(`Theme "${theme}" was found!`);

    nodeSass.render({
      file: path.resolve(themesPath, theme, `${theme}-theme.scss`),
      outFile: path.resolve(outputPath, 'themes', `${theme}-theme.scss`),
    }, function(err, result) {

      logging.loading(`Start parsing the ${theme}-theme.scss`);

      if(err) {
        console.log(err);
        logging.error('Error in parsing the theme file', err);
        return;
      }

      logging.success('Parsing has been successfully finished');

      result.css = NOTICE_MESSAGE + result.css;

      fs.writeFile(path.resolve(outputPath, 'themes', `${theme}-theme.css`), result.css, function(err) {
        if(err) {
          logging.error('Error in writing the css file', err);
          return;
        }
        copyAssetsTo(basePath, copy, path.resolve(outputPath, 'themes'), `${theme}-theme.css`);
        logging.message('Congrats! Your theme file is ready to be used.');
        logging.message(`${theme} theme file location: ${outputPath}themes/${theme}-theme.css`);

      })
    });
  }
  
})(path, fs, logging);