const fs = require('fs');
const path = require('path');
const directory = './../src'; // Replace with your target folder
const map = require('./replace-units.json');

const pattern = /^  \/\/\/ related-theme-variable: (.+)\n  \/\/\/ type: (.+)\n  \/\/\/ values: (.+)$/gm;

function getPattern1(variableRelated) {
return pattern = /^  \/\/\/ related-theme-variable: \n  \/\/\/ type: (.+)\n  \/\/\/ values: (.+)$/gm;
}

function getPattern(variableRelated) {
	// Escape for regex safety if needed
	const escapedVariable = variableRelated.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const pattern = new RegExp(
		`^\\s*\\/\\/\\/\\s*related-theme-variable:\\s*${escapedVariable}\\n\\s*\\/\\/\\/\\s*type:\\s*(.+)\\n\\s*\\/\\/\\/\\s*values:\\s*(.+)$`,
		'gm'
	);
	return pattern;
 }

function replaceInFile(filePath, componentName, myMap) {
	let content = fs.readFileSync(filePath, 'utf8');
	let replaced = false;
	for (let i = 0; i < myMap.length; i++) {
		const mapping = myMap[i];
		if (componentName === mapping.Component) {
			const key = mapping.U;
			const newValues = mapping.Variables.trim();
			content = content.replace(getPattern(newValues), (match, variable, type, values) => {
				if (newValues) {
					replaced = true;
					return `  /// related-theme-variable: ${newValues}\n  /// type: unit\n  /// values: ${key}`;
				}
				return match;
			});
		}
	}

	if (replaced) {
		// console.log('content', content);
		fs.writeFileSync(filePath, content, 'utf8');
		console.log(`Updated: ${filePath}`);
	}
}

// function walk(dir) {
// 	const files = fs.readdirSync(dir);
// 	for (const file of files) {
// 		const fullPath = path.join(dir, file);
// 		const stat = fs.statSync(fullPath);
// 		if (stat.isDirectory()) {
// 			walk(fullPath);
// 		} else if (fullPath.endsWith('_variables.scss')) {
// 			replaceInFile(fullPath);
// 		}
// 	}
// }

function groupBy(array, key) {
	return array.reduce((result, current) => {
		const groupKey = current[key];
		if (!result[groupKey]) {
			result[groupKey] = [];
		}
		result[groupKey].push(current);
		return result;
	}, {});
}

function searchAndWalk() {
	const myObject = groupBy(map, "Component");
	for (const key in myObject) {
		if (myObject.hasOwnProperty(key)) {
			console.log(myObject[key]);
			const filePath = path.resolve(directory, key, "scss", "_variables.scss");
			replaceInFile(filePath, key, myObject[key]);
		}
	}
}

searchAndWalk();