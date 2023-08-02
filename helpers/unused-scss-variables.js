// import { findAsync, find } from 'find-unused-sass-variables';
import { findAsync, find } from 'find-unused-sass-variables';
// const find = require('find-unused-sass-variables');

// 'directory' is a folder
const unused = find('src');
// Array of unused variables
console.log(unused.unused);
// Array<{ name: string, line: string, file: string }>
/*
[
  {
    name = '$foo';
    file = 'file where this variable can be found';
    line = 'line of file';
  },
  {
    ....
  }
]
*/
// Total number of variables in the files
console.log(unused.total);