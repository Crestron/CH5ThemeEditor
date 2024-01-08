const packageJson = require('../../package.json')
const CONFIG = require('./config.json');
const fs = require('fs');
const flatten = require('@raghavendradabbir/sass-flatten');
const path = require('path');
const { execSync } = require("child_process");
const jsonfile = require('jsonfile');

const components = CONFIG.COMPONENTS;

const outputJSON = {
    version: packageJson.version,
    ch5ElementThemeDefs: {}
};
const globalVars = fs.readFileSync(CONFIG.GLOBAL_VARIABLES_FILE_PATH, 'utf8');
const globalMixins = fs.readFileSync(CONFIG.GLOBAL_MIXINS_FILE_PATH, 'utf8');
const LightTheme = fs.readFileSync(CONFIG.THEME_VARIABLE_FILE, 'utf8').replace('@import "../../ch5-core/variables";', '')

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

function logger(...args) {
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

function getComponentVariables(component) {
    const sourcePath = CONFIG.THEME_EDITOR_SOURCE_FILES_PATH;
    let data = fs.readFileSync(sourcePath + component + '/scss/_variables.scss', 'utf8');

    const variables = [];
    data = removeComments(data);
    data = removeHeaders(data);
    const lines = data.split('\n');
    lines.forEach((line, i) => {
        const splitLine = line.split(':');
        if (splitLine.length === 2 && splitLine[0].includes('--')) {

            const name = splitLine[0].trim();
            const description = lines[i - 1]?.includes('///') ? lines[i - 1].replace('///', '').trim() : ''

            variables.push({
                name,
                description
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
    let scss = globalVars + globalMixins + LightTheme + componentScss;

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

function getUnusedVariables(css, cssVariables) {
    const unusedCssVariables = [];
    for (const { name } of cssVariables) {
        if (css.includes(`var(${name})`) === false) {
            unusedCssVariables.push(name);
        }
    }
    return unusedCssVariables;
}

function getVariablesNotDefined(data, cssVariables) {
    const variablesNotDefined = []
    const variableLines = data.split('\n')
        .filter(str => str.includes('var('))
        .map(str => str.split(':')[1].trim());

    const usedVars = variableLines.map((str) => {
        const startIndex = str.indexOf('var(');
        const endIndex = str.indexOf(')', startIndex);
        return str.slice(startIndex + 4, endIndex);
    });

    for (const variable of usedVars) {
        if (cssVariables.some(vars => vars.name === variable) === false) {
            variablesNotDefined.push(variable);
        }
    }

    return variablesNotDefined;
}

async function initialize() {
    const start = Date.now();
    for (const component in components) {

        const cssVariables = getComponentVariables(component);

        // logger(cssVariables);
        const componentScss = getComponentScss(component);

        const css = getComponentCss(componentScss);

        const unusedCssVariables = getUnusedVariables(css, cssVariables);

        const variablesNotDefined = getVariablesNotDefined(css, cssVariables);

        if (unusedCssVariables.length !== 0) {
            const data = {}
            data[component] = unusedCssVariables;
            console.log(data);
        }

        if (variablesNotDefined.length !== 0) {
            const data = {};
            data[component] = variablesNotDefined;
            console.log(data);
        }
        outputJSON['ch5ElementThemeDefs'][component] = {}
        outputJSON['ch5ElementThemeDefs'][component]['version'] = CONFIG['COMPONENTS'][component]['version'];
        outputJSON['ch5ElementThemeDefs'][component]['variables'] = cssVariables;
    }

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