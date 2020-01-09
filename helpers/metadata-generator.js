// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

const sassdoc = require('sassdoc'),
  fse = require('fs-extra'),
  logging = require('./logging'),
  glob = require('glob'),
  _ = require('lodash');


(function (sassdoc, fse, logging) {
  // sourceFilePath  SOURCE_FILE_PATH
  // detinationMetadata WRITE_TO_FILE_PATH
  const SOURCE_FILE_PATH = glob.sync('ch5-*/**');
  const WRITE_TO_FILE_PATH = process.argv[3].toString();
  if (!WRITE_TO_FILE_PATH) {
    logging.error('Please provide valid sourcefilepath and writetofilepath path.');
    return false;
  }

  function removeDulicate(data) {
    return data = _.uniqWith(data, _.isEqual);
  }

  function includeProperTies(resultData) {
    resultData = removeDulicate(resultData);
    return resultData.map(meta => {

      if (meta.group[0] === 'ch5-light-theme-variables') {
        const newGroupNamePostFix = `variables`;
        const names = meta.context.name.split('-');
        const newGroupName = `${names[0]}-${names[1]}-${newGroupNamePostFix}`;
        meta.group[0] = newGroupName;
      }

      let includeProperty = {};
      includeProperty.type = meta.context.type === 'css' ? 'class' : meta.context.type;
      includeProperty.name = includeProperty.type !== 'variable' ?
        meta.context.name.split(' ')[0].replace("&", "").replace(".", "") : meta.context.name;

      includeProperty.description = meta.description;
      includeProperty.group = meta.group[0];
      if (includeProperty.type !== 'variable') {
        includeProperty.value = meta.context.value;
      }
      return includeProperty;
    });
  }

  function groupByType(dataList) {
    let result = _.chain(dataList)
      .groupBy("type")
      .toPairs()
      .map((currentItem) => {
        return _.zipObject(["type", "metadata"], currentItem);
      })
      .value();
    return result;
  }

  function parseMetadata(resultData) {
    let result = _.chain(includeProperTies(resultData))
      .groupBy("group")
      .toPairs()
      .map((currentItem) => {
        currentItem[1] = _.map(currentItem[1], item => _.omit(item, ['group']));
        currentItem[1] = groupByType(currentItem[1]);
        return _.zipObject(["group", "schemadata"], currentItem);
      })
      .value();
    return result;
  }

  function createSassMetadata(srcFile, writeToFile) {
    sassdoc.parse(srcFile, { verbose: true })
      .then((data) => {
        logging.loading(`Writing metadata to ${writeToFile}`);
        if (!!parseMetadata(data)) {
          fse.outputFileSync(writeToFile, JSON.stringify(parseMetadata(data), null, 4));
        } else {
          logging.error(`Error occurred while data parsing.`);
        }
      });
  }

  createSassMetadata(SOURCE_FILE_PATH, WRITE_TO_FILE_PATH);
})(sassdoc, fse, logging);

