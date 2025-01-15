// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

const path = require('path'),
  fs = require('fs'),
  logging = require('./logging');

(function (path, fs, logging) {

  let themesPath = path.resolve(__dirname + '/../themes');
  let themesVariablesDirectory = path.resolve(__dirname + '/../src/ch5-core/themes');
  let themeName = process.argv[2];
  let themeIdentifier = '-theme';
  let ext = ".scss";
  let baseThemes = ['dark', 'light'];
  let linkingType = '';
  let extendedTheme = process.argv[3] !== undefined ? process.argv[3] : 'light';

  if (isLinkingArgument(3)) {
    linkingType = process.argv[3];
    extendedTheme = 'high-contrast';
  } else if (isLinkingArgument(4)) {
    linkingType = process.argv[4];
  }

  if (themeName === undefined) {
    logging.error(`Please provide a theme name: npm run create-theme <your-theme-name> <base-theme-name>\nExample npm run create-theme mycustom light`);
    return;
  }

  let themeGeneration = {

    theme: themeName,
    extendedTheme: extendedTheme,
    fullPath: `${themesPath}`,
    themeFilePath: `${themesPath}/${themeName}`,
    attempts: 0,
    maxAttempts: 20,

    generate: function () {
      if (this.themeExists() === false) {
        this.addThemeStructure();
      }
    },

    themeExists: function () {
      logging.loading(`Checking if theme "${this.theme}" exists...`);

      logging.loading(`Checking if extendedTheme exists ${this.extendedTheme}`);

      if (!existsTheme(this.extendedTheme)) {
        logging.error(`Extended theme ${this.extendedTheme} doesn't exists`);
        return;
      }

      if (fs.existsSync(this.themeFilePath) === true) {
        logging.error(`The theme "${this.theme}" already exists`);
        return true;
      }

      if (fs.existsSync(path.resolve(__dirname, themesVariablesDirectory, `${this.theme}${ext}`))) {
        logging.error(`A file related to "${this.theme}" theme was found in ./src/ch5-core/themes. Resolve the conflict or change the theme name and run the command again`);
        return true;
      }

      logging.success(`Theme is going to be created in ->>> ${this.fullPath}/`)
      return false;
    },

    addThemeStructure: function () {
      logging.loading('Creating base structure for theme...');

      if (linkingType.trim() === '--hard-link') {
        fs.copyFileSync(path.resolve(themesVariablesDirectory, `${this.extendedTheme}${ext}`), path.resolve(themesVariablesDirectory, `${this.theme}${ext}`));
      } else {
        copyFileAndContentsForNewTheme(path.resolve(themesVariablesDirectory, "mixins", `_${this.theme}-mixin${ext}`),
          path.resolve(themesVariablesDirectory, "mixins", `_${this.extendedTheme}-mixin${ext}`),
          this.theme,
          this.extendedTheme);
        copyFileAndContentsForNewTheme(path.resolve(themesVariablesDirectory, `_${this.theme}-temporary${ext}`),
          path.resolve(themesVariablesDirectory, `_${this.extendedTheme}-temporary${ext}`),
          this.theme,
          this.extendedTheme);
        copyFileAndContentsForNewTheme(path.resolve(themesVariablesDirectory, `_${this.theme}${ext}`),
          path.resolve(themesVariablesDirectory, `_${this.extendedTheme}${ext}`),
          this.theme,
          this.extendedTheme);
      }
      copyFileAndContentsForNewTheme(path.resolve(this.fullPath, `${this.theme}${themeIdentifier}${ext}`),
        path.resolve(themesPath, `${this.extendedTheme}${themeIdentifier}${ext}`),
        this.theme,
        this.extendedTheme);

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
    return fs.existsSync(path.resolve(themesPath, themeName + themeIdentifier + ext));
  }

  function copyFileAndContentsForNewTheme(pathVariableTo, pathVariableFrom, toTheme, fromTheme) {
    const extendedThemeScssFile = fs.readFileSync(pathVariableFrom);
    const themeNamePattern = new RegExp("(?=[^!\s])" + toTheme, "gm");
    let themeScssDefinition = extendedThemeScssFile.toString().replace(themeNamePattern, fromTheme);
    themeScssDefinition = themeScssDefinition.replace("ch5-" + fromTheme + "-theme", "ch5-" + toTheme + "-theme");
    themeScssDefinition = themeScssDefinition.replace("ch5-themes-" + fromTheme, "ch5-themes-" + toTheme);
    themeScssDefinition = themeScssDefinition.replace("../../ch5-core/themes/mixins/" + fromTheme + "-mixin", "../../ch5-core/themes/mixins/" + toTheme + "-mixin");
    themeScssDefinition = themeScssDefinition.replace('[data-theme="' + fromTheme + '-theme"', '[data-theme="' + toTheme + '-theme"');
    themeScssDefinition = themeScssDefinition.replace("." + fromTheme + "-theme {", "." + toTheme + "-theme {");
    themeScssDefinition = themeScssDefinition.replace("ch5-core/themes/" + fromTheme + "-temporary", "ch5-core/themes/" + toTheme + "-temporary");
    const themeVariablesFile = fs.createWriteStream(pathVariableTo, 'utf8');
    themeVariablesFile.write(themeScssDefinition);
    themeVariablesFile.end();
  }

})(path, fs, logging);