export const THEME_EDITOR_SOURCE_FILES_PATH = './src/';
export const OUTPUT_PATH = './dist/';
export const OUTPUT_PROPERTIES = OUTPUT_PATH + 'properties/';
export const OUTPUT_SCSS = OUTPUT_PATH + 'scss/';
export const OUTPUT_JSON = OUTPUT_PATH + 'sass-output.json';
export const COMPONENT_PATH = "../CH5ComponentLibrary/src/";

export interface PROPERTIES_INTERFACE {
  [key: string]: {
    values: string[],
    key: string,
    classListPrefix: string
  }
}

export interface RULES_INTERFACE {
  className: string,
  description: string,
  selectorStyles: { styleName: string, limits: {}[] }[],
  showWhen: {}
}

export interface BASE_OBJECT_INTERFACE {
  version: string,
  themeVersion: string,
  ch5ElementThemeDefs: {
    [key: string]: {
      componentThemeVersion: string
      selectors: RULES_INTERFACE[]
    }
  }
}
export interface FLATTENED_SCSS {
  flatScss: string,
  scss: string,
  css: string,
  name: string,
  variables: { [key: string]: string; }
}

export interface MIXIN_VARIABLES {
  [key: string]: {
    value: string,
    variables: string[]
  }
}

export interface OUTPUT {
  [key: string]: {
    description: string,
    property: string[]
  }
}

export interface MIXINS {
  name: string,
  content: string,
  properties: string[]
}



function removeComments(data: string) {
  const singleLineComments = new RegExp(/((?<!\/)[/]{2}(?!\/).*)/);
  const multiLineComments = new RegExp(/(\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\/)/);
  const allCommentsRegex = new RegExp(singleLineComments.source + '|' + multiLineComments.source, 'g');

  return data.replace(allCommentsRegex, '');
}

function removeMixins(data: string) {
  const mixinsRegex = new RegExp(/(@mixin)([\s\S]*?)(^})/, 'gm');
  return data.replace(mixinsRegex, '');
}

function removeHeaders(data: string) {
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

export {
  removeComments,
  removeMixins,
  removeHeaders
}