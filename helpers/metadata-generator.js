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
  // destinationMetadata WRITE_TO_FILE_PATH
  const SOURCE_FILE_PATH = glob.sync('src/ch5-*/**');
  const WRITE_TO_FILE_PATH = process.argv[3].toString();
  if (!WRITE_TO_FILE_PATH) {
    logging.error('Please provide valid sourcefilepath and writetofilepath path.');
    return false;
  }

  function removeDuplicate(data) {
    return data = _.uniqWith(data, _.isEqual);
  }

  function getUniqueData(metadata) {
    return filteredData = _.uniqBy(metadata, function (e) {
      return e.name;
    });
  }

  function getGroupIndexValue(res, value) {
    let obj = {};
    obj['group'] = value;
    const indexValue = _.findIndex(res, obj);
    return indexValue;
  }

  function rearrangeGroupName(resultData) {
    resultData.map((resItem) => {
      if (resItem.group === "ch5-light-theme-variables") {
        resItem.schemadata[0]['metadata'].map((schemadataItem) => {
          const newGroupNamePostFix = `variables`;
          const names = schemadataItem.name.split('-');
          let newGroupNamePrefix = `${names[0]}-${names[1]}`;
          if (newGroupNamePrefix === "ch5-overlay") {
            newGroupNamePrefix = newGroupNamePrefix + "-panel";
          } else if (newGroupNamePrefix === "ch5-modal") {
            newGroupNamePrefix = newGroupNamePrefix + "-dialog";
          }
          const newGroupName = `${newGroupNamePrefix}-${newGroupNamePostFix}`;
          const groupIndex = getGroupIndexValue(resultData, newGroupName);
          if (groupIndex !== -1) {
            resultData[groupIndex].schemadata[0]['metadata'].push(schemadataItem);
          }
        });

      }
    });

    return resultData;
  }


  function includeProperTies(resultData) {
    resultData = removeDuplicate(resultData);
    return resultData.map(meta => {
      if (!!meta.require) {
        if (meta.context.name.indexOf("&") === 0) {
          let childClassName = meta.context.name.replace("&", "");
          meta.context.name = meta.require[0].name + childClassName;
        }
        meta.description = meta.require[0].description;
      }

      let includeProperty = {};
      includeProperty.type = meta.context.type === 'css' ? 'class' : meta.context.type;
      includeProperty.name = includeProperty.type !== 'variable' ?
        meta.context.name.split(' ')[0].replace("&", "").replace(".", "") : meta.context.name;

      includeProperty.description = meta.description;
      includeProperty.group = meta.group[0];
      // if (includeProperty.type !== 'variable') {
      includeProperty.value = meta.context.value;
      // }
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
    result = result.filter(res => res.group !== "undefined");
    result.map((resultItem) => {
      if (!!resultItem.schemadata[0]['metadata'] && !!resultItem.schemadata[0]['metadata'].length) {
        return resultItem.schemadata[0]['metadata'] = getUniqueData(resultItem.schemadata[0]['metadata']);
      }
    });
    result = rearrangeGroupName(result);
    return result;
  }

  function createSassMetadata(srcFile, writeToFile) {
    sassdoc.parse(srcFile, { verbose: false }).then((data) => {
      logging.loading(`Writing metadata to ${writeToFile}`);
      const parsedData = parseMetadata(data);
      if (parsedData) {
        fse.outputFileSync(writeToFile, JSON.stringify(parsedData, null, 4));
        logging.success("SASS JSON Generated !!!!.");
      } else {
        logging.error(`Error occurred while data parsing.`);
      }
    });
  }

  createSassMetadata(SOURCE_FILE_PATH, WRITE_TO_FILE_PATH);

})(sassdoc, fse, logging);

