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

const Datastore = require('@google-cloud/datastore');
const config = require('../config');
const {promisify, makeKey} = require('./core')

// [START config]
const ds = Datastore({
  projectId: config.get('GCLOUD_PROJECT'),
});

const metaColumnPrefix = "_meta_"
const blockNumberColName = `${metaColumnPrefix}blockNumber`
const networkColName = `${metaColumnPrefix}ethNetwork`
// [END config]

// Translates from Datastore's entity format to
// the format expected by the application.
//
// Datastore format:
//   {
//     key: [kind, id],
//     data: {
//       property: value
//     }
//   }
//
// Application format:
//   {
//     id: id,
//     property: value
//   }
function fromDatastore(obj) {
  var res = {}
  res.payload = {}
  res.metadata = {}
  Object.keys(obj)
    //.filter(k => !k.startsWith(metaColumnPrefix))
    .forEach(k => k.startsWith(metaColumnPrefix) ? res.metadata[k.substring(metaColumnPrefix.length)] = obj[k] : res.payload[k] = obj[k])
  res._id = obj[Datastore.KEY].name;
  return res;
}

// Translates from the application's format to the datastore's
// extended entity property format. It also handles marking any
// specified properties as non-indexed. Does not translate the key.
//
// Application format:
//   {
//     id: id,
//     property: value,
//     unindexedProperty: value
//   }
//
// Datastore extended format:
//   [
//     {
//       name: property,
//       value: value
//     },
//     {
//       name: unindexedProperty,
//       value: value,
//       excludeFromIndexes: true
//     }
//   ]
function toDatastore(obj, nonIndexed) {
  nonIndexed = nonIndexed || [];
  const results = [];
  Object.keys(obj).forEach(k => {
    if (obj[k] === undefined) {
      return;
    }
    results.push({
      name: k,
      value: typeof obj[k] === 'string' ? obj[k].toLowerCase(): obj[k], //convert addresses and hashes to lowercase
      excludeFromIndexes: nonIndexed.indexOf(k) !== -1,
    });
  });
  return results;
}

// The ``limit`` argument determines the maximum amount of results to
// return per page. The ``token`` argument allows requesting additional
// pages. The callback is invoked with ``(err, books, nextPageToken)``.
// [START list]
function list(network, eventType, limit, fromBlock, token, cb) {
  const q = ds
    .createQuery([eventType])
    .filter(networkColName, "=", network)
    .filter(blockNumberColName, ">=", fromBlock)
    .order(blockNumberColName)
    .limit(limit)
    .start(token);

  ds.runQuery(q, (err, entities, nextQuery) => {
    if (err) {
      cb(err);
      return;
    }
    const hasMore =
      nextQuery.moreResults !== Datastore.NO_MORE_RESULTS
        ? nextQuery.endCursor
        : false;
    cb(null, entities.map(fromDatastore), hasMore);
  });
}

function lastSeenBlockNumber(network, eventType, cb) {
  const q = ds
    .createQuery([eventType])
    .filter(networkColName, "=", network)
    .order(blockNumberColName, {descending: true})
    .limit(1)

  ds.runQuery(q, (err, entities) => {
    if (err) {
      cb(err);
      return;
    }
    cb(null, entities[0][blockNumberColName]);
  });
}
// [END list]

function store (network, eventType, eventEntry) {
  let metaDataObj = {}
  Object.keys(eventEntry.metadata).forEach(k => metaDataObj[`_meta_${k}`] = eventEntry.metadata[k])
  metaDataObj[networkColName] = network
  let metaData = toDatastore(metaDataObj)
  let payloadData = toDatastore(eventEntry.payload)
  let dataToStore = payloadData.concat(metaData)
  return promisify(cb => ds.save({
    key: ds.key([eventType, makeKey(network, 
        eventEntry.metadata.blockNumber, eventEntry.metadata.transactionHash, eventEntry.metadata.logIndex)]),
    data: dataToStore
  }, cb))
}

// [START exports]
module.exports = {
  store,
  list,
  lastSeenBlockNumber
};
// [END exports]
