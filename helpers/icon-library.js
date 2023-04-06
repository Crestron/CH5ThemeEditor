// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

const path = require('path');
const fs = require('fs');
const logging = require('./logging');
const fse = require('fs-extra');

(function (path, fs, logging) {

  const fontAwesomeIconFamiliesJSONPath = `./node_modules/@fortawesome/fontawesome-free/metadata/icon-families.json`;

  try {
    const data = JSON.parse(fs.readFileSync(fontAwesomeIconFamiliesJSONPath));
    const outputArray = [];
    for (const prop in data) {
      if (Object.prototype.hasOwnProperty.call(data, prop)) {
        if (data[prop] && data[prop].familyStylesByLicense && data[prop].familyStylesByLicense.free && data[prop].familyStylesByLicense.free.length > 0) {
          for (let i = 0; i < data[prop].familyStylesByLicense.free.length; i++) {
            outputArray.push("fa" + data[prop].familyStylesByLicense.free[i].style.charAt(0) + " fa-" + prop);
          }
        }
      }
    }
    console.log(outputArray);
    const outputPath = process.argv[3] !== undefined ? process.argv[3] : './generated-metadata/icon-library.json';
    fse.outputFileSync(outputPath, JSON.stringify(outputArray, null, 4));

  } catch (err) {
    console.error(err);
  }

  // let themesPath = path.resolve(__dirname + '/../themes');
  // let themesVariablesDirectory = path.resolve(__dirname + '/../ch5-core/themes');
  // let themeName = process.argv[2];
  // let themeIdentifier = '-theme';
  // let ext = '.scss';
  // let linkingType = '';
  // let extendedTheme = process.argv[3] !== undefined ? process.argv[3] : 'light';

  // if (isLinkingArgument(3)) {
  //   linkingType = process.argv[3];
  //   extendedTheme = 'high-contrast';
  // } else if (isLinkingArgument(4)) {
  //   linkingType = process.argv[4];
  // }

  // if (themeName === undefined) {
  //   logging.error(`Please provide a theme name: npm run create-theme <your-theme-name> <base-theme-name>\nExample npm run create-theme mycustom light`);
  //   return;
  // }

})(path, fs, logging);