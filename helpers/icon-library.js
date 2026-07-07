// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

const fs = require('fs');
const fse = require('fs-extra');

const fontAwesomeIconFamiliesJSONPath = `./node_modules/@fortawesome/fontawesome-free/metadata/icon-families.json`;
const fontAwesomePackageJSONPath = `./node_modules/@fortawesome/fontawesome-free/package.json`;
const materialIconFamiliesJSONPath = `./node_modules/@material-icons/font/data.json`;
const materialIconsPackageJSONPath = `./node_modules/@material-icons/font/package.json`;
const materialSymbolsTypesPath = `./node_modules/material-symbols/index.d.ts`;
const materialSymbolsPackageJSONPath = `./node_modules/material-symbols/package.json`;
const sgIconFamiliesJSONPath = `./sg-icons/metadata.json`;
const mpIconFamiliesJSONPath = `./mp-icons/metadata.json`;

const VERSION = "1.0.0";
const URL = "";

const filterArray = (completeArray, toRemoveElementsArray) => {
  const namesToDeleteSet = new Set(toRemoveElementsArray);
  return completeArray.filter((name) => !namesToDeleteSet.has(name));
};

// v5/v6 use shorthand prefixes (fas, far, fab, fal, fad)
// v7+ use long-form prefixes (fa-solid, fa-regular, fa-brands, fa-light, fa-thin)
const FA_SHORTHAND = { solid: 'fas', regular: 'far', brands: 'fab', light: 'fal', duotone: 'fad', thin: 'fat' };
const faStylePrefix = (style, faMajor) => {
  if (faMajor >= 7) {
    return `fa-${style}`;
  }
  return FA_SHORTHAND[style] || `fa${style.charAt(0)}`;
};

const extractMaterialSymbolNames = (dTsContent) => {
  const tupleMatch = dTsContent.match(/type MaterialSymbols = \[([\s\S]*?)\];/);
  if (!tupleMatch) {
    throw new Error('Unable to parse Material Symbols names from type definition.');
  }
  const uniqueNames = new Set();
  const nameMatches = tupleMatch[1].matchAll(/"([^"]+)"/g);
  for (const match of nameMatches) {
    uniqueNames.add(match[1]);
  }
  return Array.from(uniqueNames);
};

const groupItemsByStyle = (items, getStyleName, getAlias, getAliasPrefix) => {
  const groupsMap = new Map();
  for (const item of items) {
    const styleKey = item.style || 'default';
    if (!groupsMap.has(styleKey)) {
      groupsMap.set(styleKey, {
        style: styleKey,
        styleName: getStyleName(styleKey),
        alias: getAlias ? getAlias(styleKey) : [],
        aliasPrefix: getAliasPrefix ? getAliasPrefix(styleKey) : [],
        data: []
      });
    }
    groupsMap.get(styleKey).data.push(item);
  }
  return Array.from(groupsMap.values());
};

const toTitleCase = (value) => value
  .split('-')
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

const faStyleName = (style) => {
  const normalized = style || 'default';
  const known = {
    solid: 'FA Classic Solid',
    regular: 'FA Classic Regular',
    brands: 'FA Brands',
    light: 'FA Light',
    duotone: 'FA Duotone',
    thin: 'FA Thin'
  };
  return known[normalized] || `FA ${toTitleCase(normalized)}`;
};

const materialIconsStyleName = (style) => {
  const normalized = style || 'default';
  const known = {
    baseline: 'Material Icons',
    outline: 'Material Icons Outlined',
    round: 'Material Icons Round',
    sharp: 'Material Icons Sharp',
    twotone: 'Material Icons Two Tone'
  };
  return known[normalized] || `Material Icons ${toTitleCase(normalized)}`;
};

const defaultStyleName = (style) => toTitleCase(style || 'default');

const output = {};

try {
  // font awesome
  const data = JSON.parse(fs.readFileSync(fontAwesomeIconFamiliesJSONPath));
  const faPkg = JSON.parse(fs.readFileSync(fontAwesomePackageJSONPath));
  const faVersion = faPkg.version;
  const faMajor = parseInt(faVersion.split('.')[0], 10);
  const faUrl = `https://fontawesome.com/v${faMajor}/search`;
  const itemArray = [];
  for (const prop in data) {
    if (Object.prototype.hasOwnProperty.call(data, prop)) {
      if (data[prop] && data[prop].familyStylesByLicense && data[prop].familyStylesByLicense.free && data[prop].familyStylesByLicense.free.length > 0) {
        const aliases = (data[prop].aliases && Array.isArray(data[prop].aliases.names)) ? data[prop].aliases.names : [];
        for (let i = 0; i < data[prop].familyStylesByLicense.free.length; i++) {
          const freeDataProp = data[prop].familyStylesByLicense.free[i];
          itemArray.push({
            "name": data[prop].label,
            "value": faStylePrefix(freeDataProp.style, faMajor) + " fa-" + prop,
            "alternateValue": faStylePrefix(freeDataProp.style, 5) + " fa-" + prop,
            "style": freeDataProp.style,
            "alias": aliases
          });
        }
      }
    }
  }
  output.fontAwesome = {
    version: faVersion,
    url: faUrl,
    styles: groupItemsByStyle(
      itemArray,
      faStyleName,
      (style) => faStylePrefix(style, faMajor) + " fa-",
      (style) => faStylePrefix(style, 5) + " fa-"
    )
  };
} catch (err) {
  console.error('Font Awesome processing failed:', err);
  throw err; // Rethrow to prevent writing incomplete data since MP Icons are likely critical
}

try {
  // material icons
  const data = JSON.parse(fs.readFileSync(materialIconFamiliesJSONPath));
  const materialIconsPkg = JSON.parse(fs.readFileSync(materialIconsPackageJSONPath));
  const itemArray = [];
  const families = ["baseline", "outline", "round", "sharp", "twotone"];
  const materialIconsUrl = "https://fonts.google.com/icons?icon.set=Material+Icons";

  for (const icon of data.icons) {
    const iconName = icon.name;
    const unsupportedFamilies = Array.isArray(icon.unsupported_families) ? icon.unsupported_families : [];
    for (const family of families) {
      if (unsupportedFamilies.includes(family)) {
        continue;
      }
      const value = family !== "baseline" ? "-" + family : "";
      itemArray.push({
        "name": iconName,
        "value": "material-icons" + value + " md-" + iconName,
        "alternateValue": "material-icons" + value + " md-" + iconName,
        "style": family,
        "alias": [iconName]
      });
    }
  }
  const materialIconsPrefix = (family) => "material-icons" + (family !== "baseline" ? "-" + family : "") + " md-";
  output.materialIcons = {
    version: materialIconsPkg.version,
    url: materialIconsUrl,
    styles: groupItemsByStyle(itemArray, materialIconsStyleName, materialIconsPrefix, materialIconsPrefix)
  };
} catch (err) {
  console.error('Material Icons processing failed:', err);
  throw err; // Rethrow to prevent further processing since Material Icons are likely critical
}

try {
  // material symbols
  const typeDef = fs.readFileSync(materialSymbolsTypesPath, 'utf8');
  const pkg = JSON.parse(fs.readFileSync(materialSymbolsPackageJSONPath));
  const names = extractMaterialSymbolNames(typeDef);
  const itemArray = [];
  const families = ["outlined", "rounded", "sharp"];

  for (const name of names) {
    for (const family of families) {
      itemArray.push({
        "name": name,
        "value": `material-symbols-${family} ${name}`,
        "alternateValue": `material-symbols-${family} ${name}`,
        "style": family,
        "alias": [name]
      });
    }
  }

  const materialSymbolsPrefix = (family) => `material-symbols-${family} `;
  output.materialSymbols = {
    version: pkg.version,
    url: pkg.homepage,
    styles: groupItemsByStyle(itemArray, defaultStyleName, materialSymbolsPrefix, materialSymbolsPrefix)
  };
} catch (err) {
  console.error('Material Symbols processing failed:', err);
  throw err; // Rethrow to prevent writing incomplete data since MP Icons are likely critical
}

try {
  // sg icons
  const data = JSON.parse(fs.readFileSync(sgIconFamiliesJSONPath));
  const itemArray = [];
  for (const prop of data.icons) {
    for (let i = 0; i < prop.themes.length; i++) {
      const stringValue = "sg-" + prop.themes[i];
      for (let j = 0; j < prop.alias.length; j++) {
        itemArray.push({
          "name": prop.label,
          "value": "sg " + stringValue + " sg-" + prop.alias[j],
          "alternateValue": "sg " + stringValue + " sg-" + prop.alias[j],
          "style": prop.themes[i],
          "alias": [prop.alias[j]]
        });
      }
    }
  }
  const sgIconsPrefix = (theme) => "sg sg-" + theme + " sg-";
  output.sgIcons = {
    version: VERSION,
    url: URL,
    styles: groupItemsByStyle(itemArray, defaultStyleName, sgIconsPrefix, sgIconsPrefix)
  };
} catch (err) {
  console.error('SG Icons processing failed:', err);
  throw err; // Rethrow to prevent writing incomplete data since MP Icons are likely critical
}

try {
  // mp icons
  const data = JSON.parse(fs.readFileSync(mpIconFamiliesJSONPath));
  const itemArray = [];
  for (const prop of data.icons) {
    itemArray.push({
      "name": prop.label,
      "value": "mp mp-icon " + prop.alias,
      "alternateValue": "mp mp-icon " + prop.alias,
      "style": "",
      "alias": [prop.alias]
    });
  }
  const mpIconsPrefix = () => "mp mp-icon ";
  output.mpIcons = {
    version: VERSION,
    url: URL,
    styles: groupItemsByStyle(itemArray, defaultStyleName, mpIconsPrefix, mpIconsPrefix)
  };
} catch (err) {
  console.error('MP Icons processing failed:', err);
  throw err; // Rethrow to prevent writing incomplete data since MP Icons are likely critical
}

try {
  const outputPath = process.argv[3] !== undefined ? process.argv[3] : './generated-metadata/icon-library.json';
  fse.outputFileSync(outputPath, JSON.stringify(output, null, 4));
} catch (err) {
  console.error('Failed to write output file:', err);
  throw err; // Rethrow to prevent writing incomplete data since MP Icons are likely critical
}