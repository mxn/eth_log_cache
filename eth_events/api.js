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
const {promisify, makeKey} = require('./core')
const model =  require('./model');


const router = express.Router();
 
/**
 * Retrieve a page of events (up to ten at a time).
 */
//
router.get('/:network/:contract/:eventType/events',  (req, res, next) => {
  assert.ok(req.params.contract === 'OptionFactory', "Only  OptionFactory is supported!")
  assert.ok(req.params.eventType == 'OptionTokenCreated')
  model.lastSeenBlockNumber(req.params.network, req.params.eventType , (e, lastBlockSeen) => {
    var fromBlock = req.query.fromBlock || 0
    console.debug("fromBlock: ", fromBlock)
    Promise.all([
      getParsedEthLog(req.params.network, req.params.contract, req.params.eventType, lastBlockSeen),
      promisify(cb => model.list(req.params.network, req.params.eventType, null, fromBlock, null, cb))])
        .then(twoArrs => {
          console.debug(`web3 length: ${twoArrs[0].length}; db list length: ${twoArrs[1].length}`)
          return mergeLogEntries(req.params.network, twoArrs[0], twoArrs[1])
          })
        .then(d => res.json(d.map(x => x.payload)))
  })

  const makeKeyLogEntry = (network, logEntry) => {
    let args = ["blockNumber", "transactionHash", "logIndex"].map(prop => logEntry.metadata[prop])
    args.slice(network, 0, 0, args)
    return makeKey.apply(null, args)
  } 

  const mergeLogEntries = (network, arr1, arr2) => {
    var aSet = {}
    let addToSet = element => {
      aSet[makeKeyLogEntry(network, element)] = element
    }
    arr1.forEach(addToSet)
    arr2.forEach(addToSet)
    return Object.keys(aSet).map(k => aSet[k]) 
  } 
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
