const fs = require('fs');
const CONFIG = require('./config.json');

// const components = CONFIG.COMPONENTS;

const components = {
    "ch5-animation": {
        "value": "Ch5Animation",
        "version": "1.0.0"
    },
}

function init() {
    for (const component in components) {
        const componentVariables = fs.readFileSync(`./src/${component}/scss/_variables.scss`, 'utf-8');
        const lines = componentVariables.split('\n');
        lines.forEach((line, i) => {
            if (line.includes(`--${component}--`)) {
                const metadata = lines.slice(i - 5, i);
                console.log(metadata)
                const commentAvailable = metadata.map(s => s.trim()).every(s => s.startsWith('/// '));

                if (commentAvailable) {
                    if (metadata[0].includes('description:') === false) {
                        lines[i - 5] = lines[i - 5].replace('/// ', '/// description: ')
                    }
                }

                console.log(commentAvailable);
            }
        });

        fs.writeFileSync(`./src/${component}/scss/_variables.scss`, lines.join('\n'))

    }
}


init();