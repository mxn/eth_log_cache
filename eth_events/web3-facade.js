const Web3 = require('web3')
const assert = require('assert')
const request = require('request')
const eventLogParser = require('ethereum-event-logs')
const config = require('../config')

const networkConfig = {
  kovan: {
    nameToAddress: {
      OptionFactory: '0x7a2637f799e183e276cc077c300bbff6f78df075'
    }
  }
}

const getApiEndPoint = (network) => {
  let res = `https://${network}.infura.io/${config.get('API_TOKEN')}`
  console.log("API endpoint", res)
  return res
}

var _web3
const getWeb3 = () => {
   if (!_web3) {
    _web3 = new Web3(new Web3.providers.HttpProvider(getApiEndPoint('kovan')))
    console.log('use fallback HttpProvider')
  }
  return _web3
}

const promisify = (inner) => {
  return new Promise((resolve, reject) =>
    inner((err, res) => {
      if (err) { reject(err) }
        resolve(res);
      })
    );
}

const getAbi = json => {
  return json.abi
}

const getContractAbi = contractName => {
  let json = require(`./solidity-contracts/${contractName}.json`)
  return getAbi(json)
}

const getEventHash = (contractName, eventType) => { 
  let abiEvent = getContractAbi(contractName).find((el) => el.type === 'event' && el.name === eventType)
  let paramString = abiEvent.inputs.map(input => input.type).join(',')
  return getWeb3().sha3(`${eventType}(${paramString})`)
}

const getJsonRequest = (network, contractName, eventType, fromBlock) => {
  let contractAddress = networkConfig[network].nameToAddress[contractName]
  assert.ok(contractAddress)
  let eventHash = getEventHash(contractName, eventType)
  var req = {jsonrpc : "2.0" ,id :11, method:"eth_getLogs"}
  req.params = [{topics: [eventHash], address: contractAddress, "fromBlock":  getWeb3()._extend.utils.toHex(fromBlock || 0) ,"toBlock":"latest"}]
  return JSON.stringify(req)
}

const getEthLogJson =  async (network, contract, eventType, fromBlock) => {
  let res = await promisify(cb => request({
     url: getApiEndPoint(network),
     method: 'POST',
     body: getJsonRequest(network, contract, eventType, fromBlock),
     headers: [
       {
         name: 'content-type',
         value: 'application/json'
       }
     ],
   }, cb))
   return res.body
 }
 
 
 
 const getParsedEthLog =  async (network, contract, eventType, fromBlock) => {
   let jsonResponse = JSON.parse(await getEthLogJson(network, contract, eventType, fromBlock))
   let jsonLogArr = jsonResponse.result
   let abi = getContractAbi(contract)
   let abiEvents = abi.filter((el) => el.type === 'event' && el.name === eventType)
   let parsedLogEvents = eventLogParser.parseLog(jsonLogArr,abiEvents)
     .map(x => {return {metadata: {blockNumber: parseInt(x.blockNumber), blockHash: x.blockHash, 
       transactionHash: x.transactionHash, logIndex: parseInt(x.log.logIndex)}, payload: x.args}})
   return parsedLogEvents
 }
 

module.exports = {
  getParsedEthLog,
  getJsonRequest
}
