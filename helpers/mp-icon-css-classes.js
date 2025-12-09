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

  const mpIconFamiliesJSONPath = `./mp-icons/metadata.json`;

  try {
    const responseArray = [];

    {
      // mp icons
      const data = JSON.parse(fs.readFileSync(mpIconFamiliesJSONPath));
      responseArray.push(`
.mp {
}
.mp-size {
height:24px;
width:24px;
}
`);
      for (const prop of data.icons) {
        let stringValue = ".mp.mp-size"
        let finalStringValue = stringValue + '.' + prop.alias
        /* for (let j = 0; j < prop.alias.length; j++) {
          finalStringValue += stringValue + (j === 1 ? "." : ".mp-") + prop.alias[j] + ",";
        } */
        // finalStringValue = finalStringValue.substring(0, finalStringValue.length - 1);
        console.log(finalStringValue);

        let filePathForIcon = "";
        filePathForIcon = "./../svgs/icons/";
        responseArray.push(`
          ${finalStringValue} {
            background-image: url('${filePathForIcon}${prop.fileName}');           
          }`);
      }
    }

    const allCssPath = process.argv[3] !== undefined ? process.argv[3] : './mp-icons/css/all.css';
    fse.outputFileSync(allCssPath, responseArray.join("\n"));

  } catch (err) {
    console.error(err);
  }

})(path, fs, logging);