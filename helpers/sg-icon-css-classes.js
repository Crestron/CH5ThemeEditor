// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

const path = require('path');
const fs = require('fs');
const logging = require('./logging');
const fse = require('fs-extra');

(function (path, fs, logging) {

  const sgIconFamiliesJSONPath = `./sg-icons/metadata.json`;

  try {
    const outputArray = [];

    {
      // sg icons
      const data = JSON.parse(fs.readFileSync(sgIconFamiliesJSONPath));
      outputArray.push(`
.sg {
}

.sg-icons-lg,.sg-media-transports-light,.sg-media-transports-dark,.sg-media-transports-accents {
  height: 100px;
  width: 100px;
}

.sg-icons-sm {
  height: 20px;
  width: 20px;
}`);
      for (const prop of data.icons) {
        for (let i = 0; i < prop.themes.length; i++) {
          let stringValue = ".sg-" + prop.themes[i];
          let finalStringValue = "";
          for (let j = 0; j < prop.alias.length; j++) {
            finalStringValue += stringValue + ".sg-" + prop.alias[j] + ",";
          }
          finalStringValue = finalStringValue.substring(0, finalStringValue.length - 1);

          let filePathForIcon = "";
          if (prop.themes[i] === "icons-lg" || prop.themes[i] === "icons-sm") {
            filePathForIcon = "./../svgs/icons/";
          } else {
            const propVal =  prop.themes[i].split("-") ;
            filePathForIcon = "./../svgs/media-transports/" + propVal[propVal.length - 1] + "/";
          }
          outputArray.push(`
${finalStringValue} {
  background: url('${filePathForIcon}${prop.fileName}');
  background-repeat: no-repeat;
  background-size: contain;
  display: inline-block;
}`);
        }
      }
    }

    const outputPath = process.argv[3] !== undefined ? process.argv[3] : './sg-icons/css/all.css';
    fse.outputFileSync(outputPath, outputArray.join("\n"));

  } catch (err) {
    console.error(err);
  }

})(path, fs, logging);