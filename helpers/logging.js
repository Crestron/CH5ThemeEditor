// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

let logging = {
  
  loading: function(message) {
    this._log(`Loading ->>>> ${message}`, '\x1b[33m')
  },
  error: function(message) {
    this._log(`Error: ${message}`, '\x1b[31m');
  },
  success: function(message) {
    this._log(`Success: ${message}`, '\x1b[32m');
  },
  message: function(message) {
    this._log(message,'\x1b[30m\x1b[42m');
  },
  _log: function(message, color) {
    console.log(`${color} ${message} \x1b[0m`)
  }
}

module.exports = logging;