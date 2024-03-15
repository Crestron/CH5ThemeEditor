const fs = require('fs');

 function buildHelper(data) {
    data = data.split('\n')

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


    // replace variables
    for (let i = 0; i < data.length; i++) {
        if (!data[i]) { continue; }
        for (const variable in variables) {
            if (data[i] && data[i].includes(`var(${variable})`)) {
                data[i] = data[i].replaceAll(`var(${variable})`, variables[variable])
            }
        }
    }


    // // remove null lines from data and return
    return data.filter(line => line !== null).join('\n');
}

module.exports = {buildHelper}