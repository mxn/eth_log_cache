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

const {getOptionFactoryInstance, getOptionFactoryAbi, promisify} = require("./core")
const express = require('express')
const request = require('request')
const SolidityCoder = require("web3/lib/solidity/coder.js");
const SolidityEvent = require("web3/lib/web3/event.js");
const eventLogParser = require('ethereum-event-logs')



const testPayload = 
'{"jsonrpc":"2.0","id":11,"method":"eth_getLogs","params":[{"topics":["0x3ec66ca66f5513d42ece39babf6ab6a9177e30527051b76a3b5dc98e36952471","0x000000000000000000000000d0a1e359811322d97991e03f863a0c30c2cf029c","0x000000000000000000000000c4375b7de8af5a38a93548eb8453a498222c4ff2"],"address":"0x7a2637f799e183e276cc077c300bbff6f78df075","fromBlock":"0x0","toBlock":"latest"}]}'

function getModel() {
  return require('./model');
}

const router = express.Router();

/**
 * Retrieve a page of events (up to ten at a time).
 */
router.get('/', (req, res, next) => {
  var fromBlock = 0;
  if (req.query && req.query.fromBlock) {
    fromBlock =  req.query.fromBlock
  } 
  getParsedEthLog().then((d) => res.json(d))
});

const getEthLogJson =  async () => {
 let res = await promisify(cb => request({
    url: 'https://kovan.infura.io/3NXHF2x3QMz0j8uyF5kc',
    method: 'POST',
    body: testPayload,
    headers: [
      {
        name: 'content-type',
        value: 'application/json'
      }
    ],
  }, cb))
  return res.body
}

const getParsedEthLog =  async () => {
  let jsonResponse = JSON.parse(await getEthLogJson())
  let jsonLogArr = jsonResponse.result
  let abi = getOptionFactoryAbi()
  let abiEvents = abi.filter((el) => el.type === 'event' && el.name === 'OptionTokenCreated')
  let parsedLogEvents = eventLogParser.parseLog(jsonLogArr,abiEvents)
    .map(x => {return {blockNumber: parseInt(x.blockNumber), blockHash: x.blockHash, 
      transactionHash: x.transactionHash, logIndex: parseInt(x.log.logIndex), payload: x.args}})
  return parsedLogEvents
}


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
