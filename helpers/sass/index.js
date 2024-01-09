const packageJson = require('../../package.json')
const CONFIG = require('./config.json');
const fs = require('fs');
const flatten = require('@raghavendradabbir/sass-flatten');
const path = require('path');
const { execSync } = require("child_process");
const jsonfile = require('jsonfile');

const components = CONFIG.COMPONENTS;
const themes = CONFIG.THEMES;

const outputJSON = {
    version: packageJson.version,
    ch5ElementThemeDefs: {}
};
const globalVars = fs.readFileSync(CONFIG.GLOBAL_VARIABLES_FILE_PATH, 'utf8');
const globalMixins = fs.readFileSync(CONFIG.GLOBAL_MIXINS_FILE_PATH, 'utf8');
const LightTheme = fs.readFileSync(CONFIG.THEME_VARIABLE_FILE, 'utf8').replace('@import "../../ch5-core/variables";', '')
const globalVariables = getVariables(globalVars + LightTheme);

function removeComments(data) {
    const singleLineComments = new RegExp(/((?<!\/)[/]{2}(?!\/).*)/);
    const multiLineComments = new RegExp(/(\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\/)/);
    const allCommentsRegex = new RegExp(singleLineComments.source + '|' + multiLineComments.source, 'g');

    return data.replace(allCommentsRegex, '');
}

function removeHeaders(data) {
    const lines = data.split('\n');
    let start = -1;
    for (let i = 0; i < lines.length; i++) {
        if (start === -1 && lines[i].includes('////')) {
            start = i;
        } else if (start !== -1 && lines[i].includes('////')) {
            const headers = lines.slice(start, i + 1).join('\n');
            data = data.replace(headers, '');
            start = -1;
        }
    }
    return data;
}

function getVariables(data) {
    const variables = [];
    data = removeComments(data);
    data = removeHeaders(data);
    const lines = data.split('\n');
    lines.forEach((line, i) => {
        const splitLine = line.split(':');
        if (splitLine.length === 2 && splitLine[0].includes('--')) {

            const name = splitLine[0].trim();
            const description = lines[i - 1]?.includes('///') ? lines[i - 1].replace('///', '').trim() : ''
            let value = splitLine[1].trim().replaceAll(';', '');

            // Corner Case
            if (value === '#{$black}') { value = "rgb(0, 0, 0)" }
            if (value === '#{$white}') { value = "rgb(255, 255, 255)" }

            variables.push({
                name,
                description,
                value
            });
        }
    });

    return variables;
}

function getComponentScss(component) {
    const sourcePath = CONFIG.THEME_EDITOR_SOURCE_FILES_PATH
    const entryFile = sourcePath + component + '/' + component + '.scss';
    const componentEntry = fs.readFileSync(entryFile, 'utf-8');
    const componentScss = flatten(componentEntry, path.resolve(path.join(sourcePath, component)));
    let scss = globalVars + globalMixins + componentScss;

    return removeComments(scss);
}

function getComponentCss(data) {

    // create a local scss file and compile
    const inputFile = CONFIG.CSS_INPUT_FILE_NAME;
    const outputFile = CONFIG.CSS_OUTPUT_FILE_NAME;

    fs.writeFileSync(inputFile, data);
    execSync(`sass ${inputFile} ${outputFile}`);
    const css = fs.readFileSync(outputFile, 'utf-8');

    // cleanup
    fs.unlinkSync(CONFIG.CSS_INPUT_FILE_NAME);
    fs.unlinkSync(CONFIG.CSS_OUTPUT_FILE_NAME);
    fs.unlinkSync(CONFIG.CSS_OUTPUT_FILE_NAME + '.map');

    return css;
}

function getUnusedVariables(css, variables) {
    const unusedVariables = new Set();
    for (let i = 0; i < variables.length; i++) {
        if (css.includes(`var(${variables[i].name})`) === false) {
            if (globalVariables.some(variable => variable.name === variables[i].name) === false) {
                unusedVariables.add(variables[i].name);
            }
        }
    }
    return [...unusedVariables];
}

function getVariablesNotDefined(data, variables) {
    const variablesNotDefined = new Set();
    const variableLines = data.split('\n')
        .filter(str => str.includes('var('))
        .map(str => str.split(':')[1].trim());

    const usedVars = variableLines.map((str) => {
        const startIndex = str.indexOf('var(');
        const endIndex = str.indexOf(')', startIndex);
        return str.slice(startIndex + 4, endIndex);
    });

    for (const variable of usedVars) {
        if (variables.some(vars => vars.name === variable) === false) {
            if (globalVariables.some(vars => vars.name === variable) === false) {
                variablesNotDefined.add(variable);
            }
        }
    }

    return [...variablesNotDefined];
}

async function initialize() {
    const start = Date.now();
    for (const component in components) {

        const { THEME_EDITOR_SOURCE_FILES_PATH: sourcePath, VARIABLES_PATH } = CONFIG;
        const data = fs.readFileSync(sourcePath + component + VARIABLES_PATH, 'utf8');
        const variables = getVariables(data);

        const componentScss = getComponentScss(component);

        const css = getComponentCss(componentScss);

        const unusedVariables = getUnusedVariables(css, variables);

        const variablesNotDefined = getVariablesNotDefined(css, variables);


        outputJSON['ch5ElementThemeDefs'][component] = {}
        outputJSON['ch5ElementThemeDefs'][component]['version'] = components[component]['version'];
        outputJSON['ch5ElementThemeDefs'][component]['variables'] = variables;

        if (unusedVariables.length !== 0) {
            const data = {}
            data[component] = unusedVariables;
            console.log(`\x1b[31m unused , ${JSON.stringify(data)} \x1b[0m`);
        }

        if (variablesNotDefined.length !== 0) {
            const data = {};
            data[component] = variablesNotDefined;

            // Corner case
            if (component === 'ch5-slider' && data[component].length === 1 && data[component][0] === '--temp-var') {
                continue;
            }
            console.log(`\x1b[31m not defined , ${JSON.stringify(data)} \x1b[0m`);
        }
    }

    // Theme variables
    outputJSON['ch5ElementThemeDefs']['ch5-core'] = {}
    for (const theme in themes) {

        const basePath = CONFIG.THEME_EDITOR_THEME_FILES_PATH;
        const data = fs.readFileSync(basePath + theme + '.scss', 'utf8');

        const variables = getVariables(data);

        outputJSON['ch5ElementThemeDefs']['ch5-core'][theme] = {}
        outputJSON['ch5ElementThemeDefs']['ch5-core'][theme]['version'] = themes[theme]['version'];
        outputJSON['ch5ElementThemeDefs']['ch5-core'][theme]['variables'] = variables;
    }

    outputJSON['ch5ElementThemeDefs']['ch5-global'] = {}
    outputJSON['ch5ElementThemeDefs']['ch5-global']['version'] = CONFIG.GLOBAL_VARIABLES_VERSION;
    outputJSON['ch5ElementThemeDefs']['ch5-global']['variables'] = getVariables(globalVars);



    const writeToIndex = process.argv.findIndex(element => element === "--writeTo");
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