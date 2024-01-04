const packageJson = require('../package.json')
const CONFIG = require('./config.json');
const fs = require('fs');
const flatten = require('@raghavendradabbir/sass-flatten');
const path = require('path');
const sassVars = require('get-sass-vars');
const { execSync } = require("child_process");
const jsonfile = require('jsonfile');

import { BASE_OBJECT_INTERFACE, removeComments, FLATTENED_SCSS, MIXINS, removeMixins, removeHeaders, OUTPUT } from "./utils";

const components = CONFIG.COMPONENTS;
const outputJSON: BASE_OBJECT_INTERFACE = {
  version: packageJson.version,
  themeVersion: CONFIG.THEME_VERSION,
  ch5ElementThemeDefs: {}
};
const globalVars = fs.readFileSync(CONFIG.GLOBAL_VARIABLES_FILE_PATH, 'utf8');
const globalMixins = fs.readFileSync(CONFIG.GLOBAL_MIXINS_FILE_PATH, 'utf8');
const LightTheme = fs.readFileSync(CONFIG.THEME_VARIABLE_FILE, 'utf8').replace('@import "../../ch5-core/variables";', '')


function logger(...args: any[]) {
  if (CONFIG.DEBUG === true) {
    const arr = args;
    for (let i = 0; i < arr.length; i++) {
      if (typeof arr[i] === 'object') {
        console.log(JSON.stringify(arr[i], null, 4));
      } else {
        console.log(arr[i]);
      }
    }
  }
}

function processComponentClasses(componentClasses: string[], flattenScss: FLATTENED_SCSS) {

  const { name, css, variables } = flattenScss;

  const output: OUTPUT = {}

  const cssClasses = css.split('}').map(s => s = s + '}').filter(s => s.includes('{'));

  // logger(name, typeof componentClasses, typeof css);
  // componentClasses.forEach((cls)=>logger(name + ' '))
  for (const variable in variables) {
    componentClasses.forEach((classes: string) => {
      // Ignore if not used
      if (classes.includes(variable) === false) { return; }

      const matchingIndex = classes.split('\n')
        .map((line: string, index: number) => line.includes(variable) && index)
        .filter((line: boolean | number) => line !== false);

      const matchingLines = classes.split('\n').filter(line => line.includes(variable));
      matchingLines.forEach((line, index) => {
        const property = line.trim().split(':')[0].trim();
        const matchingCss = cssClasses.find(cssClass => cssClass.includes(property + ': ' + variables[variable]))
        const className = matchingCss.split('{')[0].trim();

        const descriptionClass = classes.split('\n');
        let description = '';
        for (let i = matchingIndex[index]; i >= 0; i--) {
          if (descriptionClass[i].includes('///')) {
            description = descriptionClass[i].replace('///', '').trim();
            break;
          }
        }
        if (output.hasOwnProperty(className)) {
          output[className].property.push(property);
          output[className].description = description;
        } else {
          output[className] = { description, property: [] }
          output[className].property.push(property);
        }

      })
    });
  }

  outputJSON['ch5ElementThemeDefs'][name] = {
    componentThemeVersion: components[name]['version'],
    selectors: []
  }

  for (const cls in output) {
    const template: any = {
      "className": cls,
      "description": output[cls]['description'],
      "selectorStyles": [],
      "showWhen": []
    }
    output[cls]['property'].forEach(property => {
      const propertyTemplate = {
        "styleName": property,
        "limits": [
          {}
        ]
      }
      template['selectorStyles'].push(propertyTemplate);
    });
    outputJSON['ch5ElementThemeDefs'][name]['selectors'].push(template);

  }
}

function convertScssToCss(scss: string) {

  // create a local scss file and compile
  fs.writeFileSync(CONFIG.CSS_INPUT_FILE_NAME, scss);
  execSync(`sass ${CONFIG.CSS_INPUT_FILE_NAME} ${CONFIG.CSS_OUTPUT_FILE_NAME}`);
  const css = fs.readFileSync(CONFIG.CSS_OUTPUT_FILE_NAME, 'utf-8');

  // cleanup
  fs.unlinkSync(CONFIG.CSS_INPUT_FILE_NAME);
  fs.unlinkSync(CONFIG.CSS_OUTPUT_FILE_NAME);
  fs.unlinkSync(CONFIG.CSS_OUTPUT_FILE_NAME + '.map');

  return css;
}

async function addSassVariables(flatScss: FLATTENED_SCSS) {

  const scss = globalVars + globalMixins + LightTheme + flatScss.flatScss;
  const variables = await sassVars(scss);

  // Edge Case for rgb values
  for (const key in variables) {
    const value: string = variables[key];
    if (typeof value === 'string' && value.includes('rgb')) {
      variables[key] = value.replaceAll(',', ', ');
    }
  }

  for (const key in variables) {
    if (flatScss.flatScss.includes(key) === false) {
      delete variables[key];
    }
  }

  flatScss.variables = variables;
  flatScss.scss = removeComments(scss);
}

function processMixinsSelfInclude(mixins: MIXINS[]) {

  const nestedMixins: Set<string> = new Set();

  const includeNameRegex = new RegExp(/(@include[ a-zA-Z0-9-]+)/, '');
  const getMixinProperties = (data: string, name: string) => data.split(`${name}(`)[1].split(')')[0].split(',').map(s => s.trim()).filter(s => s.length !== 0);
  for (const mixin of mixins) {

    while (mixin.content.includes('@include')) {
      nestedMixins.add(mixin.name);
      const mixinName = mixin.content.match(includeNameRegex)[0].substring(9);

      const startIndex = mixin.content.indexOf('@include ' + mixinName);
      const endIndex = mixin.content.indexOf(')', startIndex);
      const includeHeader = mixin.content.slice(startIndex, endIndex + 2);

      const mixinToBeIncluded = mixins.find(mixin => mixin.name === mixinName)
      let mixinContent = mixinToBeIncluded.content;
      if (mixinToBeIncluded.properties.length !== 0) {
        const includeProperties = getMixinProperties(mixin.content, mixinName);
        for (let i = 0; i < includeProperties.length; i++) {
          mixinContent = mixinContent.replaceAll(mixinToBeIncluded.properties[i], includeProperties[i]);
        }
      }

      mixin.content = mixin.content.replace(includeHeader, mixinContent + ' ');

    }
  }
  return { nestedMixins, mixins };
}

function processScss(processedMixin: { nestedMixins: Set<string>, mixins: MIXINS[] }, data: string) {
  const { nestedMixins, mixins } = processedMixin;
  const getMixinProperties = (data: string) => data.split('(')[1].split(')')[0].split(',').map(s => s.trim()).filter(s => s.length !== 0);

  mixins.forEach((mixin: MIXINS) => nestedMixins.add(mixin.name))

  nestedMixins.forEach((mixinName: string) => {
    while (data.includes('@include ' + mixinName)) {

      // @include metaData
      const startIndex = data.indexOf('@include ' + mixinName);
      const endIndex = data.indexOf(')', startIndex);
      const includeHeader = data.slice(startIndex, endIndex + 2);
      const includeProperties = getMixinProperties(includeHeader);

      // Mixin Data
      let { content, properties } = mixins.find(mixin => mixin.name === mixinName);
      properties.forEach((prop: string, index: number) => {
        content = content.replaceAll(prop, includeProperties[index]);
      });
      data = data.replace(includeHeader, content);
    }
  });

  return data;
}

function extractAndProcessMixins(data: string) {
  const mixins: any[] = [];
  // This will match the whole mixin except the last closing bracket } which we will consider to be the last one.
  const mixinsRegex = new RegExp(/(@mixin)([\s\S]*?)(^})/, 'gm');
  const mixinNameRegex = new RegExp(/(@mixin[ a-zA-Z0-9-]+)/, 'g');
  const mixinContentRegex = new RegExp(/(?<={)[\s\S]*(?=})/, 'g');
  const getMixinProperties = (data: string) => data.split('(')[1].split(')')[0].split(',').map(s => s.trim()).filter(s => s.length !== 0);

  for (const mixin of (data.match(mixinsRegex) || [])) {
    if (mixin && mixin.match(mixinNameRegex)) {
      const name = mixin.match(mixinNameRegex)[0].substring(7).trim();
      const content = mixin.match(mixinContentRegex)[0];
      const properties = mixin.includes(name + '(') ? getMixinProperties(mixin) : [];

      // DO NOT add unused mixins
      if (data.includes('@include ' + name) === false) { continue; }

      mixins.push({ name, content, properties });
    }
  }

  const processedMixin: { nestedMixins: Set<string>, mixins: MIXINS[] } = processMixinsSelfInclude(mixins);

  const mixinData = removeMixins(data)

  const scss = processScss(processedMixin, mixinData);

  return scss;
}

function flattenScssComponents(name: string) {

  // Create component properties in outputJSON
  const componentProperties = {
    "componentThemeVersion": CONFIG.COMPONENTS[name]['version'],
    "selectors": [] as any
  }
  outputJSON['ch5ElementThemeDefs'][name] = componentProperties


  const fileName = '/' + name + '.scss';
  const sourcePath = CONFIG.THEME_EDITOR_SOURCE_FILES_PATH;
  const entrySCSSContent = fs.readFileSync(sourcePath + name + fileName, 'utf8');

  let data = flatten(globalMixins + entrySCSSContent, path.resolve(path.join(sourcePath, name)));
  data = removeComments(data);
  data = removeHeaders(data);
  data = extractAndProcessMixins(data);

  const flattenComponent = {
    flatScss: data,
    name,
    variables: {},
    scss: '',
    css: '',
  }

  return flattenComponent;
}

function generateComponentClasses(data: string) {
  const classes: string[] = [];

  let start = -1;
  let nested = 0;
  const lines = data.split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('{')) {
      nested++;
      if (start === -1) {
        for (let j = i; j >= 0; j--) {
          if (lines[j].trim().length === 0) {
            start = j;
            break;
          }
        }
      }
    } else if (lines[i].includes('}')) {
      nested--;
      if (nested === 0 && start !== -1) {
        const content = lines.slice(start, i + 1).join('\n');
        classes.push(content);
        start = -1;
      }
    }
  }
  logger('data type ' + typeof classes);
  return classes;
}

async function initialize() {
  const start = Date.now();
  const componentKeys = Object.keys(components);

  componentKeys.length = 1

  for (let i = 0; i < componentKeys.length; i++) {
    const flattenScss = flattenScssComponents(componentKeys[i]);
    await addSassVariables(flattenScss);
    flattenScss.css = convertScssToCss(flattenScss.scss);
    const componentClasses = generateComponentClasses(flattenScss.flatScss);
    // logger(componentClasses)
    // componentClasses.forEach((data: string) => logger(data));
    processComponentClasses(componentClasses, flattenScss)
  }
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