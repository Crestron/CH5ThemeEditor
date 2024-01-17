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
	ch5Components: [],
	ch5Themes: []
};
const globalVars = fs.readFileSync(CONFIG.GLOBAL_VARIABLES_FILE_PATH, 'utf8');
const globalMixins = fs.readFileSync(CONFIG.GLOBAL_MIXINS_FILE_PATH, 'utf8');
const sampleTheme = fs.readFileSync(CONFIG.SAMPLE_THEME_VARIABLES_FILE, 'utf8').replace('@import "../../ch5-core/variables";', '')
const globalVariables = getVariables(globalVars + sampleTheme, "global");

const unusedVars = [];
const undefinedVars = [];

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

function getType(data, variables) {
	if (data.includes('calc(') === false && data.startsWith('var(')) {
		data = data.slice(4, data.lastIndexOf(')'));
		const variable = variables.find((variable) => variable.name === data);
		if (variable) {
			data = variable.value;
		} else if (data !== "--fa-style-family-classic") {
			const variable = globalVariables.find((variable) => variable.name === data);
			if (variable) {
				data = variable.value;
			}
		}
	}
	const units = ['px', '%', 'em', 'rem', 'vh', 'vw'];
	const hexColorRegex = new RegExp(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);
	if (isNaN(Number(data)) === false) {
		return "number";
	} else if ((data.includes('calc') || units.some(unit => data.includes(unit))) && data.includes('linear-gradient') === false) {
		return "unit";
	} else if (data.includes('rgb') || hexColorRegex.test(data)) {
		return "color";
	} else {
		return "string";
	}
}

function getVariables(data, sectionName) {
	const variables = [];
	data = removeComments(data);
	data = removeHeaders(data);
	const lines = data.split('\n');

	lines.forEach((line, i) => {
		const splitLine = line.split(':');
		if (splitLine.length === 2 && splitLine[0].includes('--')) {

			const name = splitLine[0].trim();
			const description = lines[i - 1]?.includes('///') ? lines[i - 1].replace('///', '').trim() : '';
			if (description === "") {
				console.log(`\x1b[31m ${name} does not have description \x1b[0m`)
				process.exit(1);
			}
			let value = splitLine[1].trim().replaceAll(';', '');

			// Corner Case
			if (value === '#{$black}') { value = "#000"; }
			if (value === '#{$white}') { value = "#fff"; }

			const type = getType(value, variables);

			if (sectionName === "theme") {
				let sectionUpdatedName = sectionName;
				if (name.indexOf("--theme-ch5-") !== -1) {
					for (const component in components) {
						if (name.indexOf(component) !== -1) {
							sectionUpdatedName = component;
							break;
						}
					}
				} else {
					sectionUpdatedName = name.replace("--theme-", "");
					sectionUpdatedName = sectionUpdatedName.split("-")[0];
				}

				variables.push({
					sectionName: sectionUpdatedName,
					data: {
						name,
						description,
						value,
						type
					}
				}
				);
			} else {
				variables.push({
					name,
					description,
					value,
					type
				});
				// variables.push({
				// 	data: {
				// 		name,
				// 		description,
				// 		value,
				// 		type
				// 	}
				// });
			}

		}
	});

	return variables;
}

function getComponentScss(component) {
	const sourcePath = CONFIG.THEME_EDITOR_SOURCE_FILES_PATH
	const entryFile = sourcePath + component + '/' + component + '.scss';
	const componentEntry = fs.readFileSync(entryFile, 'utf-8');
	const componentScss = flatten(componentEntry, path.resolve(path.join(sourcePath, component)));
	const scss = globalVars + globalMixins + componentScss;
	return removeComments(scss);
}

function getComponentCss(data) {

	const inputFile = CONFIG.CSS_INPUT_FILE_NAME;
	const outputFile = CONFIG.CSS_OUTPUT_FILE_NAME;

	// create a local scss file and compile
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

function getUndefinedVariables(data, variables) {
	const undefinedVariables = new Set();
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
				undefinedVariables.add(variable);
			}
		}
	}

	return [...undefinedVariables];
}

function validateVariables(component, variables) {
	const componentScss = getComponentScss(component);

	const css = getComponentCss(componentScss);

	const unusedVariables = getUnusedVariables(css, variables);

	const undefinedVariables = getUndefinedVariables(css, variables);

	if (unusedVariables.length !== 0) {
		unusedVars.push({
			name: component,
			variables: unusedVariables
		})
	}

	if (undefinedVariables.length !== 0) {
		undefinedVars.push({
			name: component,
			variables: undefinedVariables
		})
	}
}

function getSectionNames(variablesList) {
	const response = [];
	const uniqueSections = [];
	for (let i = 0; i < variablesList.length; i++) {
		if (!uniqueSections.includes(variablesList[i].sectionName)) {
			uniqueSections.push(variablesList[i].sectionName);
		}
	}
	for (let i = 0; i < uniqueSections.length; i++) {
		const tempVars = variablesList.filter(filterObj => filterObj.sectionName === uniqueSections[i]);
		const tempList = [];
		for (let j = 0; j < tempVars.length; j++) {
			tempList.push(tempVars[j].data);
		}
		response.push({
			name: uniqueSections[i],
			variables: tempList
		});
	}
	return response;
}

async function initialize() {
	const start = Date.now();
	for (const component in components) {
		const { THEME_EDITOR_SOURCE_FILES_PATH: sourcePath, VARIABLES_PATH } = CONFIG;
		const data = fs.readFileSync(sourcePath + component + VARIABLES_PATH, 'utf8');
		const variables = getVariables(data, component);

		outputJSON['ch5Components'].push({
			name: component,
			version: components[component]['version'],
			variables
		});

		// Add Variables validation
		validateVariables(component, variables);
	}


	// Theme variables
	for (const theme in themes) {

		const basePath = CONFIG.THEME_EDITOR_THEME_FILES_PATH;
		const data = fs.readFileSync(basePath + theme + '.scss', 'utf8');

		const variables = getVariables(data, "theme");

		const sectionNamesList = getSectionNames(variables);
		outputJSON['ch5Themes'].push({
			themeName: theme,
			version: themes[theme]['version'],
			variables: sectionNamesList
		});
	}

	// Validate Variables
	unusedVars.forEach(({ name, variables }) => {
		variables.forEach((variable) => {
			console.log(`\x1b[31m ${name} unused variable ${variable} \x1b[0m`);
			process.exit(1);
		})
	})

	undefinedVars.forEach(({ name, variables }) => {
		variables.forEach((variable) => {
			if (name === 'ch5-slider' && variable === '--temp-var') {
				// Corner case
			} else {
				console.log(`\x1b[31m ${name} undefined variable ${variable} \x1b[0m`);
				process.exit(1);
			}
		})
	})

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