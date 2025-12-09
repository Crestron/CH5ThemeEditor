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
  const materialIconFamiliesJSONPath = `./node_modules/@material-icons/font/data.json`;
  const sgIconFamiliesJSONPath = `./sg-icons/metadata.json`;
  const mpIconFamiliesJSONPath = `./mp-icons/metadata.json`;

  const filterArray = (completeArray, toRemoveElementsArray) => {
    // make a Set to hold values from toRemoveElementsArray
    const namesToDeleteSet = new Set(toRemoveElementsArray);
    // use filter() method to filter only those elements that need not to be deleted from the array
    const newArr = completeArray.filter((name) => {
      // return those elements not in the namesToDeleteSet
      return !namesToDeleteSet.has(name);
    });
    return newArr;
  }

  try {
    const responseArray = {};

    {
      // font awesome
      const data = JSON.parse(fs.readFileSync(fontAwesomeIconFamiliesJSONPath));
      const itemArray = [];
      for (const prop in data) {
        if (Object.prototype.hasOwnProperty.call(data, prop)) {
          if (data[prop] && data[prop].familyStylesByLicense && data[prop].familyStylesByLicense.free && data[prop].familyStylesByLicense.free.length > 0) {
            for (let i = 0; i < data[prop].familyStylesByLicense.free.length; i++) {
              itemArray.push({
                "name": data[prop].label,
                "value": "fa" + data[prop].familyStylesByLicense.free[i].style.charAt(0) + " fa-" + prop
              });
            }
          }
        }
      }
      responseArray.fontAwesome = itemArray;
    }

    {
      // material icons
      const data = JSON.parse(fs.readFileSync(materialIconFamiliesJSONPath));
      const itemArray = [];
      const families = [
        "baseline",
        "outline",
        "round",
        "sharp",
        "twotone"
      ];
      for (const prop of data.icons) {
        const supportedFamilies = (prop.unsupported_families && prop.unsupported_families.length > 0) ? filterArray(families, prop.unsupported_families) : [];
        for (let i = 0; i < supportedFamilies.length; i++) {
          let value = "";
          if (supportedFamilies[i] !== "baseline") {
            value = "-" + supportedFamilies[i];
          }
          itemArray.push({
            "name": prop.name,
            "value": "material-icons" + value + " md-" + prop.name
          });
        }
      }
      responseArray.materialIcons = itemArray;
    }

    {
      // sg icons
      const data = JSON.parse(fs.readFileSync(sgIconFamiliesJSONPath));
      const itemArray = [];
      for (const prop of data.icons) {
        for (let i = 0; i < prop.themes.length; i++) {
          let stringValue = ".sg-" + prop.themes[i];
          for (let j = 0; j < prop.alias.length; j++) {
            itemArray.push({
              "name": prop.label,
              "value": ".sg " + stringValue + " .sg-" + prop.alias[j]
            });
          }
        }
      }

      responseArray.sgIcons = itemArray;
    }

    {
      // mp icons
      const data = JSON.parse(fs.readFileSync(mpIconFamiliesJSONPath));
      const itemArray = [];
      for (const prop of data.icons) {
        itemArray.push({
          "name": prop.label,
          "value": ".mp .mp-size ." + prop.alias
        });
      }

      responseArray.mpIcons = itemArray;
    }

    const outputPath = process.argv[3] !== undefined ? process.argv[3] : './generated-metadata/icon-library.json';
    fse.outputFileSync(outputPath, JSON.stringify(responseArray, null, 4));

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