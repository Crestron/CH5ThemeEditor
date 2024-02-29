const packageJson = require('../../package.json') // TODO: Currently picking from parent folder package.json, In future it should be picked from helpers folder
const CONFIG = require('./config.json');
const fs = require('fs');
const flatten = require('@raghavendradabbir/sass-flatten');
const path = require('path');
const { execSync } = require("child_process");

let components = CONFIG.COMPONENTS;

let currentComponent = "";
const outputJSON = {
	version: packageJson.version,
	ch5ElementThemeDefs: {}
};
const globalVars = fs.readFileSync(CONFIG.GLOBAL_VARIABLES_FILE_PATH, 'utf8');
const globalMixins = fs.readFileSync(CONFIG.GLOBAL_MIXINS_FILE_PATH, 'utf8');
const schemaJson = JSON.parse(fs.readFileSync(CONFIG.SCHEMA_URL, 'utf-8'));
const sassMetadataJson = JSON.parse(fs.readFileSync(CONFIG.SASS_METADATA_URL, 'utf-8'));


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

function getComponentScss(component) {
	const sourcePath = CONFIG.THEME_EDITOR_SOURCE_FILES_PATH;
	const entryFile = sourcePath + component + '/' + component + '.scss';
	const componentEntry = fs.readFileSync(entryFile, 'utf-8')
		.replace('@import "./scss/variables";', '')
		.replace("@import './scss/variables';", '')
		.replace('@import "scss/variables";', '')
		.replace("@import 'scss/variables';", '')
		.replace('@import "./scss/variables.scss";', '');
	const componentScss = flatten(componentEntry, path.resolve(path.join(sourcePath, component)));
	const scss = globalVars + globalMixins + componentScss;
	return removeComments(scss);

}

// function getComponentScss(component) {
// 	const sourcePath = CONFIG.THEME_EDITOR_SOURCE_FILES_PATH;
// 	const entryFile = sourcePath + component + '/' + component + '.scss';
// 	const componentEntry = fs.readFileSync(entryFile, 'utf-8');
// 	const componentScss = flatten(componentEntry, path.resolve(path.join(sourcePath, component)));
// 	const scss = globalVars + globalMixins + componentScss;
// 	return removeComments(scss);
// }

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

function getComponentVariables() {
	return sassMetadataJson['ch5Components']
		.find((component) => component.name === currentComponent)['variables']
		.map(vars => vars.name);
}

function getClassNames(data) {
	const res = [];
	const lines = data.split('\n');
	const componentVariables = getComponentVariables();
	componentVariables.forEach(variable => {
		lines.forEach((line, i) => {
			if (line.includes(`var(${variable})`)) {
				let j;
				for (j = i - 1; j >= 0; j--) {
					if (lines[j].includes('}')) {
						break;
					}
				}
				j++;

				const classes = lines.slice(j, i).join('');
				const classNames = classes.slice(0, classes.indexOf('{'));
				if (classNames.includes(',')) {
					res.push({
						name: classNames.trim(),
						property: line.split(':')[0].trim()
					})
				} else {
					classNames.split(',').forEach(cls => {
						if (cls.trim()) {
							res.push({
								name: cls.trim(),
								property: line.split(':')[0].trim()
							})
						}
					})
				}
			}
		})
	});

	return res;

}


function processCssData(data) {

	const selectors = getComponentSelector();
	const classData = getClassNames(data);
	const processData = {};

	classData.forEach(({ name, property }) => {
		if (processData[name]) {
			processData[name].push(property);
		} else {
			processData[name] = [];
			processData[name].push(property);
		}
	})
	for (const d in processData) {
		selectors.push({
			className: d,
			description: "",
			selectorStyles: [],
			showWhen: []
		});
		processData[d].forEach(property => selectors[selectors.length - 1]['selectorStyles'].push({
			styleName: property,
			limits: [
				{}
			]
		}));

	}
}

function getComponentSelector() {
	return outputJSON['ch5ElementThemeDefs'][currentComponent]['selectors'];
}


function sortOutputJSON() {

	// Sort components
	outputJSON['ch5Components']
		.sort((a, b) => a.name > b.name ? 1 : -1)

	// Sort component variables
	outputJSON['ch5Components']
		.forEach(component => component['variables']
			.sort((a, b) => a.name > b.name ? 1 : -1))

	// sort theme 
	outputJSON['ch5Themes']
		.sort((a, b) => a.themeName > b.themeName ? 1 : -1)

	// sort theme components
	outputJSON['ch5Themes']
		.forEach(theme => theme['variables']
			.sort((a, b) => a.name > b.name ? 1 : -1))

	// sort theme components variables
	outputJSON['ch5Themes']
		.forEach(theme => theme['variables']
			.forEach(componentVars => componentVars['variables']
				.sort((a, b) => a.name > b.name ? 1 : -1)))

}

function getSchemaAttributes() {
	const component = schemaJson['ch5Elements']['elements'].find(element => element.tagName === currentComponent)
	return component ? component['attributes'] : [];
}

function updateShowWhenProperty() {
	const selectors = getComponentSelector();
	for (const attribute of getSchemaAttributes()) {
		attribute.value.forEach((value) => {
			const checkName = `.${currentComponent}--${attribute.name}-${value}`;
			selectors.forEach((selector) => {
				if (selector.className.includes(checkName)) {
					selector['showWhen'].push({
						attribute: attribute.name,
						value
					});
				}
			})
		});
	}
}

async function initialize() {
	const start = Date.now();

	for (const component in components) {
		currentComponent = component;
		outputJSON['ch5ElementThemeDefs'][component] = {
			componentThemeVersion: components[component]['version'],
			selectors: []
		}

		const componentScss = getComponentScss(component);

		const css = getComponentCss(componentScss);

		processCssData(css);

		updateShowWhenProperty();

	}

	const outputPath = process.argv[3] !== undefined ? process.argv[3] : CONFIG.DEFAULT_OUTPUT_PATH;
	fs.writeFileSync(outputPath, JSON.stringify(outputJSON, null, 4));
	console.log(`Schema generated in ${((Date.now() - start) / 1000).toFixed(2)} seconds`)
}

initialize();