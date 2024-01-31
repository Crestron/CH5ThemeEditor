const packageJson = require('../../package.json')
const CONFIG = require('./config.json');
const fs = require('fs');
const flatten = require('@raghavendradabbir/sass-flatten');
const path = require('path');
const { execSync } = require("child_process");

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

function findMissingThemeVariables() {
	const themesVariables = [];
	const missing = [];

	// Add theme variables
	for (const theme in themes) {
		const data = fs.readFileSync(CONFIG.THEME_EDITOR_THEME_FILES_PATH + theme + '.scss', 'utf-8')
		themesVariables.push({
			name: themes[theme]['value'],
			variables: getVariables(data)
		})
	}

	for (let i = 0; i < themesVariables.length; i++) {
		for (let j = 0; j < themesVariables.length; j++) {

			// Skip if the index are same
			if (i === j) { continue; }

			themesVariables[i]['variables'].forEach((currentVar) => {
				const found = themesVariables[j]['variables'].findIndex((variable) => variable.name === currentVar.name);
				if (found === -1) {
					missing.push({
						source: themesVariables[i]['name'],
						variable: currentVar.name,
						destination: themesVariables[j]['name']
					});
				}
			});
		}
	}
	if (missing.length !== 0) {
		missing.forEach(variable => {
			console.log(`\x1b[31m ${variable.source} variable '${variable.variable}' is missing in ${variable.destination} \x1b[0m`);
		});
		process.exit(1);
	}
}

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

function getVariables(data, sectionName) {
	const variables = [];
	const variablesSet = new Set();
	data = removeComments(data);
	data = removeHeaders(data);
	const lines = data.split('\n');

	lines.forEach((line, i) => {
		const splitLine = line.split(':');
		if (splitLine.length === 2 && splitLine[0].includes('--')) {

			if (sectionName !== 'theme' && sectionName !== 'global' && splitLine[0].trim().startsWith('--theme') === false) {
				if (line.includes('var(') === false) {
					console.log(`\x1b[31m '${splitLine[0].trim()}' missing theme variable \x1b[0m`)
				}
			}
			const name = splitLine[0].trim();
			if (variablesSet.has(name)) {
				console.log(`\x1b[31m '${name}' Duplicate Variable \x1b[0m`)
				process.exit(1);
			}
			variablesSet.add(name);
			let start = i - 1;
			for (let j = i - 1; j >= 0; j--) {
				if (lines[j].includes('///') === false) {
					break;
				}
				start = j;
			}

			let description = '';
			let type = '';
			let valueMetadata = '';
			let possibleValues = '';
			let example = '';

			const variableMetaData = lines.slice(start, i).join('\n').split('///').map(str => str.trim()).filter(str => str.length !== 0);

			if (variableMetaData.length < 4) {
				// console.log(name + 'invalid metadata')
				// process.exit(1);

				if (sectionName === 'theme') {
					const componentName = name.replace('--theme-', '').split('--')[0]
					const componentVariables = outputJSON['ch5Components'].find(t => t.name === componentName)['variables']
					const variableObj = componentVariables.find(t => t.name === name.replace('--theme', '-'));
					if (variableObj) {
						description = variableObj.description + ' at theme level';
						type = variableObj.type
						example = variableObj.example
						possibleValues = variableObj.possibleValues
					}
				}
			} else {
				description = variableMetaData[0];
				type = variableMetaData[1].replace('type:', '').trim();
				valueMetadata = variableMetaData[2].replace('values:', '').trim()
				possibleValues = type === 'color' ? ["rgb(35,35,35)", "#1a1a1a", "red"] : valueMetadata.split(',').map((str) => str.trim()).filter((str) => str.trim())
				example = variableMetaData[3].replace('example:', '').trim()
			}

			let value = splitLine[1].trim().replaceAll(';', '');

			// Corner Case
			if (value === '#{$black}') { value = "#000"; }
			if (value === '#{$white}') { value = "#fff"; }

			if (sectionName === "theme") {
				let sectionUpdatedName = sectionName;
				if (name.indexOf("--theme-ch5-") !== -1) {
					const reversedComponets = Object.keys(components).reverse();
					for (const component of reversedComponets) {
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
						type,
						example,
						value,
						possibleValues
					}
				});
				if (variableMetaData.length === 5) {
					const relatedThemeVariable = variableMetaData[4].replace('related-theme-variable:', '').trim()
					variables[variables.length - 1]['data']['relatedThemeVariable'] = relatedThemeVariable;
				}

			} else {
				variables.push({
					name,
					description,
					type,
					example,
					value,
					possibleValues
				});
				if (variableMetaData.length === 5) {
					const relatedThemeVariable = variableMetaData[4].replace('related-theme-variable:', '').trim()
					variables[variables.length - 1]['relatedThemeVariable'] = relatedThemeVariable;
				}
			}

		}
	});

	return variables.sort((a, b) => a.name > b.name ? 1 : -1);
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
		const count = str.split('var(').length - 1;
		if (count === 1) {
			const startIndex = str.indexOf('var(');
			const endIndex = str.indexOf(')', startIndex);
			return str.slice(startIndex + 4, endIndex);
		} else {
			let newStr = str;
			const vars = []
			for (let i = 0; i < count; i++) {
				const startIndex = newStr.indexOf('var(');
				const endIndex = newStr.indexOf(')', startIndex);
				vars.push(newStr.slice(startIndex + 4, endIndex));
				newStr = newStr.slice(endIndex)
			}
			return vars;
		}
	}).flat();

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

function checkComponentVariable() {
	const components = outputJSON['ch5Components'];
	const themes = outputJSON['ch5Themes'];
	const missingVariables = [];
	const relatedThemeDescription = [];
	const variableThemeVariables = [];

	for (const component of components) {
		const componentVariables = component['variables'];

		for (const theme of themes) {
			const themeVariables = theme['variables'];
			const componentThemeVariables = themeVariables.find(t => t.name === component.name);

			if (componentThemeVariables) {
				componentVariables.forEach(element => {
					const variable = componentThemeVariables['variables'].find(t => t.name === element.name.replace('-', '--theme'))
					if (variable === undefined) {
						missingVariables.push(`${component.name} ${element.name} missing at ${theme.themeName} theme`)
					}
				});
				componentThemeVariables['variables'].forEach(element => {
					const variable = componentVariables.find(t => t.name === element.name.replace('--theme', '-'))
					if (variable === undefined) {
						missingVariables.push(`${component.name} ${element.name} missing at component`)
					}
				});
			}
		}

	}

	for (const component of components) {
		const variables = component['variables'];

		for (const variable of variables) {
			if (variable.relatedThemeVariable.startsWith('--theme') === false) {
				relatedThemeDescription.push(`validate ${variable.name} relatedThemeVariable variable`);
			}
		}

	}

	for (const component of components) {
		const variables = component['variables'];

		for (const variable of variables) {
			if (variable.value.startsWith('var(--theme-') === false) {
				variableThemeVariables.push(`validate ${variable.name} theme variable`);
			}
		}

	}

	if (missingVariables.length !== 0) {
		missingVariables.forEach((description) => {
			console.log(`\x1b[31m ${description} \x1b[0m`);
		});
		// process.exit(1);
	}
	if (relatedThemeDescription.length !== 0) {
		relatedThemeDescription.forEach((description) => {
			console.log(`\x1b[31m ${description} \x1b[0m`);
		});
		// process.exit(1);
	}
	if (variableThemeVariables.length !== 0) {
		variableThemeVariables.forEach((description) => {
			console.log(`\x1b[31m ${description} \x1b[0m`);
		});
		// process.exit(1);
	}
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

	let unusedVariables = [];
	// Validate Variables
	unusedVars.forEach(({ name, variables }) => {
		variables.forEach((variable) => {
			const cornerCase1 = name === 'ch5-triggerview' && variable === '--ch5-triggerview--gap';
			const cornerCase2 = name === 'ch5-triggerview' && variable === '--ch5-triggerview--slide-max-height';
			const cornerCase3 = name === 'ch5-triggerview' && variable === '--ch5-triggerview--slide-min-height';
			const cornerCase4 = name === 'ch5-triggerview' && variable === '--ch5-triggerview--transition-duration';
			if (cornerCase1 || cornerCase2 || cornerCase3 || cornerCase4) {
				// Corner Case
			} else {
				unusedVariables.push({ name, variable });
			}

		});
	});

	let undefinedVariables = [];
	undefinedVars.forEach(({ name, variables }) => {
		variables.forEach((variable) => {
			const cornerCase1 = name === 'ch5-slider' && variable === '--temp-var';
			const cornerCase2 = name === 'ch5-button' && variable === '--fa-style-family-classic';
			const cornerCase3 = name === 'ch5-slider' && variable === '--ch5-slider--size-x-small-handle-height-oval';
			const cornerCase4 = name === 'ch5-slider' && variable === '--ch5-slider--size-small-handle-height-oval';
			const cornerCase5 = name === 'ch5-slider' && variable === '--ch5-slider--size-regular-handle-height-oval';
			const cornerCase6 = name === 'ch5-slider' && variable === '--ch5-slider--size-large-handle-height-oval';
			const cornerCase7 = name === 'ch5-slider' && variable === '--ch5-slider--size-x-large-handle-height-oval';
			if (cornerCase1 || cornerCase2 || cornerCase3 || cornerCase4 || cornerCase5 || cornerCase6 || cornerCase7) {
				// Corner case
			} else {
				undefinedVariables.push({ name, variable });
			}
		});
	});
	if (unusedVariables.length !== 0 || undefinedVariables.length !== 0) {
		if (unusedVariables.length !== 0) {
			console.log(`\x1b[31m unused variables: \x1b[0m`);
			for (let i = 0; i < unusedVariables.length; i++) {
				console.log(`\x1b[31m ${unusedVariables[i].name}: ${unusedVariables[i].variable} \x1b[0m`);
			}
			console.log("");
		}
		if (undefinedVariables.length !== 0) {
			console.log(`\x1b[31m undefined variables: \x1b[0m`);
			for (let i = 0; i < undefinedVariables.length; i++) {
				console.log(`\x1b[31m ${undefinedVariables[i].name}: ${undefinedVariables[i].variable} \x1b[0m`);
			}
		}
		process.exit(1);
	}

	checkComponentVariable();

	const outputPath = process.argv[3] !== undefined ? process.argv[3] : CONFIG.DEFAULT_OUTPUT_PATH;
	fs.writeFileSync(outputPath, JSON.stringify(outputJSON, null, 4));
	console.log(`Schema generated in ${((Date.now() - start) / 1000).toFixed(2)} seconds`)
}

findMissingThemeVariables();
initialize();