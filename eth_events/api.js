// Copyright 2017, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const {getParsedEthLog} = require("./web3-facade")
const express = require('express')
const assert = require('assert')
const {promisify} = require('./core')

function getModel() {
  return require('./model');
}

const router = express.Router();
 
/**
 * Retrieve a page of events (up to ten at a time).
 */
//
router.get('/:network/:contract/:eventType/events',  (req, res, next) => {
  assert.ok(req.params.contract === 'OptionFactory', "Only  OptionFactory is supported!")
  assert.ok(req.params.eventType == 'OptionTokenCreated')
  getParsedEthLog(req.params.network, req.params.contract, req.params.eventType, req.params.fromBlock)
      .then((d) => res.json(d.map(x => x.payload)))
  /* if (req.params.fromBlock) {
    getParsedEthLog(req.params.network, req.params.contract, req.params.eventType, req.params.fromBlock)
      .then((d) => res.json(d.map(x => x.payload)))
  } else {
    getModel().lastSeenBlockNumber(network, eventType, lastBlock => {
      getParsedEthLog(req.params.network, req.params.contract, req.params.eventType, lastBlock).then((d) => res.json(d))
    })
  } */
});



router.use((err, req, res, next) => {
  // Format error and forward to generic error handler for logging and
  // responding to the request
  err.response = {
    message: err.message,
    internalCode: err.code,
  };
  next(err);
});

module.exports = router;
