const packageJson = require('../package.json')
const CONFIG = require('./config.json');
const fs = require('fs');
const flatten = require('@raghavendradabbir/sass-flatten');
const path = require('path');
const sassVars = require('get-sass-vars');
const { execSync } = require("child_process");
const jsonfile = require('jsonfile');

import { BASE_OBJECT_INTERFACE, removeComments, FLATTENED_SCSS } from "./utils";

const components = CONFIG.COMPONENTS;
const outputJSON: BASE_OBJECT_INTERFACE = {
  version: packageJson.version,
  themeVersion: CONFIG.THEME_VERSION,
  ch5ElementThemeDefs: {}
};


function logger(...args: any[]) {
  if (CONFIG.DEBUG === true) {
    console.log(...args);
  }
}

function getDescription(flattenLines: string[], index: number) {

  let start = -1;
  for (let i = index; i >= 0; i--) {
    if (flattenLines[i].includes('}')) {
      start = i;
      break;
    }
  }
  let snippet = flattenLines.slice(start + 1, index)

  const lastIndex = snippet.findLastIndex(lines => lines.includes('/// '));
  if (lastIndex === -1) { return '' }


  if (snippet.some(lines => lines.includes('///////'))) {
    const copyRightLastIndex = snippet.findLastIndex(lines => lines.includes('///////'))
    snippet = snippet.slice(copyRightLastIndex + 1);
    if (snippet.includes('/// ') === false) {
      return '';
    }
  }

  const comment = snippet[lastIndex].replace('/// ', '').trim();

  return comment;
}

function findClassExiting(clsName: string, name: string) {
  return outputJSON['ch5ElementThemeDefs'][name]['selectors'].some(selector => selector.className === clsName);
}

function findPropertyExisting(clsName: string, property: string, name: string) {
  const selectors = outputJSON['ch5ElementThemeDefs'][name]['selectors'];
  const clsSelectors = selectors.filter(selector => selector.className === clsName)[0];
  return clsSelectors.selectorStyles.some((selectorStyle) => selectorStyle.styleName === property);
}

function findAndPushSelector(clsName: string, name: string, selectorProperty: any) {
  const selectors = outputJSON['ch5ElementThemeDefs'][name]['selectors'];
  const clsSelectors = selectors.filter(selector => selector.className === clsName)[0];
  clsSelectors.selectorStyles.push(selectorProperty);
}


function getClass(lines: string[], index: number, property: string, name: string, description: string) {
  let start = -1;
  for (let i = index - 1; i >= 0; i--) {
    if (lines[i].includes('}')) {
      start = i;
      break;
    }
  }

  const currentSelector = lines.slice(start + 1, index + 1);
  const trimmedSelector = currentSelector.filter(str => str.trim().length !== 0);
  const clsName = trimmedSelector.join('\n').split('{')[0].trim();

  const selector = {
    className: clsName,
    description: description,
    selectorStyles: [
      {
        styleName: property,
        limits: [
          {}
        ]
      }
    ],
    showWhen: [] as any
  }

  if (findClassExiting(clsName, name)) {
    if (findPropertyExisting(clsName, property, name) === false) {

      findAndPushSelector(clsName, name, selector.selectorStyles[0]);

    }
  } else {
    outputJSON['ch5ElementThemeDefs'][name]['selectors'].push(selector)
  }

}

function getClassName(flattenScss: string, outputCss: string, variable: string, value: string, name: string) {

  const lines = outputCss.split('\n');
  const flattenLines = flattenScss.split('\n');

  for (let i = 0; i < lines.length; i++) {

    // Ignore if not found
    if (lines[i].includes(value) === false) { continue; }

    const property = lines[i].split(':')[0].trim();

    for (let j = 0; j < flattenLines.length; j++) {

      // Ignore if not found
      if (flattenLines[j].includes(`${property}: ${variable}`) === false) { continue; }

      const description = getDescription(flattenLines, j);
      getClass(lines, i, property, name, description);
    }
  }
}


function setCustomVars(flattenScss: FLATTENED_SCSS[]) {
  for (let i = 0; i < flattenScss.length; i++) {
    const { allScss, variables, flattenedScss, name } = flattenScss[i];
    fs.writeFileSync(CONFIG.CSS_INPUT_FILE_NAME, allScss);
    execSync(`sass ${CONFIG.CSS_INPUT_FILE_NAME} ${CONFIG.CSS_OUTPUT_FILE_NAME}`);
    const outputCss = fs.readFileSync(CONFIG.CSS_OUTPUT_FILE_NAME, 'utf-8');
    flattenScss[i].finalCss = outputCss;

    fs.unlinkSync(CONFIG.CSS_INPUT_FILE_NAME);
    fs.unlinkSync(CONFIG.CSS_OUTPUT_FILE_NAME);
    fs.unlinkSync(CONFIG.CSS_OUTPUT_FILE_NAME + '.map');

    for (const variable in variables) {
      const value = variables[variable];

      // Ignore if not available
      if (flattenedScss.includes(variable) === false) { continue; }
      getClassName(flattenedScss, outputCss, variable, value, name)
    }

    // cleanup memory after use
    delete flattenScss[i];
  }
}

async function addSassVariables(flattenScss: FLATTENED_SCSS[]) {

  const globalVars = fs.readFileSync(CONFIG.GLOBAL_VARIABLES_FILE_PATH, 'utf8');
  const globalMixins = fs.readFileSync(CONFIG.GLOBAL_MIXINS_FILE_PATH, 'utf8');
  const LightTheme = fs.readFileSync(CONFIG.THEME_VARIABLE_FILE, 'utf8').replace('@import "../../ch5-core/variables";', '')

  for (let i = 0; i < flattenScss.length; i++) {
    const { flattenedScss } = flattenScss[i];
    const flatCSS = globalVars + globalMixins + LightTheme + flattenedScss;
    const variables = await sassVars(flatCSS);

    // Edge Case 
    variables['$ch5-scrollbar-track-color'] = 'rgba(0, 0, 0, 0.1)';
    variables['$ch5-scrollbar-thumb-color'] = 'rgba(0, 0, 0, 0.5)';


    flattenScss[i].variables = variables;
    flattenScss[i].allScss = removeComments(flatCSS);
  }
}

function flattenScssComponents(paths: string[]) {
  const flattenedComponents: FLATTENED_SCSS[] = [];

  // For Debugging comment after use
  // paths.length = 3;

  for (let i = 0; i < paths.length; i++) {

    const name = paths[i];
    const fileName = '/' + name + '.scss';
    const sourcePath = CONFIG.THEME_EDITOR_SOURCE_FILES_PATH;
    const entrySCSSContent = fs.readFileSync(sourcePath + name + fileName, 'utf8');
    const flattenedScss = flatten(entrySCSSContent, path.resolve(path.join(sourcePath, name)));
    const cleanScss = removeComments(flattenedScss);
    flattenedComponents.push({
      flattenedScss: cleanScss,
      name,
      variables: {},
      allScss: '',
      finalCss: '',
    });

    // Create component properties in outputJSON
    const componentProperties = {
      "componentThemeVersion": CONFIG.COMPONENTS[name]['version'],
      "selectors": [] as any
    }
    outputJSON['ch5ElementThemeDefs'][name] = componentProperties
  }
  return flattenedComponents;
}


async function initialize() {
  const start = Date.now();
  const componentKeys = Object.keys(components);
  const flattenScss = flattenScssComponents(componentKeys);
  await addSassVariables(flattenScss);
  setCustomVars(flattenScss);
  // logger(flattenScss);
  logger(JSON.stringify(outputJSON, null, 4))

  const writeToIndex: number = process.argv.findIndex(element => element === "--writeTo");
  if (writeToIndex >= 0 && process.argv.length > (writeToIndex + 1)) {
    const writeTo = process.argv[writeToIndex + 1];
    if (writeTo && writeTo !== "") {
      jsonfile.writeFileSync(writeTo, outputJSON, { spaces: 2, EOL: '\r\n' });
    } else {
      jsonfile.writeFileSync(CONFIG.DEFAULT_OUTPUT_PATH, outputJSON, { spaces: 2, EOL: '\r\n' });
    }
  } else {
    jsonfile.writeFileSync(CONFIG.DEFAULT_OUTPUT_PATH, outputJSON, { spaces: 2, EOL: '\r\n' });
  }
  console.log(`Schema generated in ${((Date.now() - start) / 1000).toFixed(2)} seconds`)
}


initialize();