// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

const path = require('path'),
  fs = require('fs'),
  logging = require('./logging');

(function(path, fs, logging) {

  let themesPath = path.resolve(__dirname + '/../themes');
  let themesVariablesDirectory = path.resolve(__dirname + '/../ch5-core/themes');
  let themeName = process.argv[2];
  let themeIdentifier = '-theme';
  let baseThemes = ['dark', 'light'];
  let ext = '.scss';
  let linkingType = '';
  let extendedTheme = process.argv[3] !== undefined ? process.argv[3] : 'light';

  if(isLinkingArgument(3)) {
    linkingType = process.argv[3];
    extendedTheme = 'high-contrast';
  } else if(isLinkingArgument(4)) {
    linkingType = process.argv[4];
  }

  if(themeName === undefined) {
    logging.error(`Please provide a theme name: npm run create-theme <your-theme-name> <base-theme-name>\nExample npm run create-theme mycustom light`);
    return;
  } 

  let themeGeneration = {
    
    theme: themeName,
    extendedTheme: extendedTheme,
    fullPath: `${themesPath}/${themeName}`,
    themeFilePath: `${themesPath}/${themeName}`,
    attempts: 0,
    maxAttempts: 20,

    generate: function() {
      console.log('Dirname ', __dirname);
      if(this.themeExists() === false) {
        this.addThemeStructure();
      }
    },

    themeExists: function() {
      logging.loading(`Checking if theme "${this.theme}" exists...`);

      logging.loading(`Checking if extendedTheme exists ${this.extendedTheme}`);

      if(!existsTheme(this.extendedTheme)) {
        logging.error(`Extended theme ${this.extendedTheme} doesn't exists`);
        return;
      }

      if(
        fs.existsSync(this.fullPath) === true ||
        fs.existsSync(this.fullPath) === true
      ) {
        logging.error(`The theme "${this.theme}" already exists`);
        return true;
      }

      if(fs.existsSync(path.resolve(__dirname, themesVariablesDirectory, `${this.theme}${ext}`))) {
        logging.error(`A file related to "${this.theme}" theme was found in ./ch5-core/themes. Resolve the conflict or change the theme name and run the command again`);
        return true;
      }

      logging.success(`Theme is going to be created in ->>> ${this.fullPath}/`)
      return false;
    },

    addThemeStructure: function() {

      logging.loading('Creating base structure for theme...');
      fs.mkdirSync(this.fullPath);

      if(linkingType.trim() === '--hard-link') { 
        
        fs.copyFileSync(path.resolve(themesVariablesDirectory ,`${this.extendedTheme}${ext}`) ,path.resolve(themesVariablesDirectory, `${this.theme}${ext}`));
      } else {
        let themeVariablesFile = fs.createWriteStream(path.resolve(themesVariablesDirectory, `${this.theme}${ext}`));
        themeVariablesFile.write(`// this file provides location where you override variables used in extended theme`);
        themeVariablesFile.write(`\n\n\n// put your variables before the @import below \n`);
        themeVariablesFile.write(`@import "./${this.extendedTheme}${ext}";`);
        themeVariablesFile.end();
      }
      
      const extendedThemeScssFile = fs.readFileSync(path.resolve(themesPath, this.extendedTheme, `${this.extendedTheme}${themeIdentifier}${ext}`));
      const themeNamePattern = new RegExp("(?=[^!\s])" + this.extendedTheme, "gm");
      const themeScssDefinition = extendedThemeScssFile.toString().replace(themeNamePattern, this.theme);
      const currentScssFile = fs.createWriteStream(path.resolve(this.fullPath, `${this.theme}${themeIdentifier}${ext}`), 'utf8');
      currentScssFile.write(themeScssDefinition);
      currentScssFile.end();

      logging.success('Base structure was successfully created');
      logging.message(`Congrats!!! ->>> Go modify your theme in ./ch5-core/themes/${this.theme}.scss`);
      logging.message(`the theme is located at the following path: ${this.fullPath}/${this.theme}${themeIdentifier}${ext}`);
    }
  }

  themeGeneration.generate();

  function isLinkingArgument(argumentIndex) {
    return process.argv[argumentIndex] !== undefined && process.argv[argumentIndex] === '--hard-link' || process.argv[argumentIndex] === '--soft-link';
  }

  function existsTheme(themeName) {
    return fs.existsSync(path.resolve(themesPath, themeName));
  }

})(path, fs, logging);