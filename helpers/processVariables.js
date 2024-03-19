const fs = require('fs');

function replaceAll(str, find, replace) {
    if (str && String(str).trim() !== "") {
        return String(str).split(find).join(replace);
    } else {
        return str;
    }
}

function buildHelper(theme) {
    data = theme.split('{').map(str => str.split('}')).flat(5).map(str => str.split(';')).flat(4).map(str => str.trim());

    const configComponents = JSON.parse(fs.readFileSync('./helpers/sass-metadata/config.json', 'utf-8'))['COMPONENTS'];
    const undefinedVariables = []
    for (const component in configComponents) {
        if (configComponents[component]['undefined']) {
            undefinedVariables.push(...configComponents[component]['undefined']);
        }
    }
    const variables = {}

    // store variables
    for (let i = 0; i < data.length; i++) {
        if (data[i].trim().startsWith('--') === false) { continue; }
        const isUndefinedVariables = undefinedVariables.some((undefinedVars) => data[i].trim().includes(undefinedVars));
        if (isUndefinedVariables) { continue; }

        const [variable, value] = data[i].split(';')[0].split(':').map(s => s.trim());
        variables[variable] = value;
        data[i] = null;
    }

    // Run twice to replace all variables nesting
    for (const variable in variables) {
        if (variables[variable].includes('var(')) {
            const valueVariable = variables[variable].replace('var(', '').slice(0, -1);
            variables[variable] = variables[valueVariable];
        }
    }

    for (const variable in variables) {
        theme = replaceAll(theme, `var(${variable})`, variables[variable]);
        theme = replaceAll(theme,`${variable}: ${variables[variable]};`,'')
        theme = replaceAll(theme,`${variable}: ${variables[variable]}`,'')
        theme = replaceAll(theme,`${variable}:${variables[variable]};`,'')
        theme = replaceAll(theme, `${variable}:${variables[variable]}`, '')
    }
    

    return theme;
}


module.exports = { buildHelper }