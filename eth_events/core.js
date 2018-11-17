const Web3 = require('web3')

const jsonOptionFactory = require("./solidity-contracts/OptionFactory.json")

var web3
const getWeb3 = () => {
   if (!web3) {
    web3 = new Web3(new Web3.providers.HttpProvider("https://kovan.infura.io/3NXHF2x3QMz0j8uyF5kc"))
    console.log('use fallback HttpProvider')
  }
  return web3
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

const getOptionFactoryAbi = () => {
  return getAbi(jsonOptionFactory)
}

const getContractInstance =  (json, address) => {
  let contract = getWeb3().eth.contract(json.abi)
  return contract.at(address)
}

const getNetworkId = () => {
  return  promisify(cb => getWeb3().version.getNetwork(cb))
}

const getNetworkName = async () => {
  switch (Number(await getNetworkId())) {
    case 1: return "main"
    case 3: return "ropsten"
    case 42: return "kovan"
    default: return "unknown development"
  }
}

const getOptionFactoryInstance = async () => {
  let netId = await getNetworkId()
  //console.log(netId)
  switch (Number(netId)) {
    case 3: //ropsten
      return getContractInstance(jsonOptionFactory, "0xb7b68150022054daf980461a99d19d807afa8ca0")
    case 42: //kovan
      return getContractInstance(jsonOptionFactory, "0x7a2637f799e183e276cc077c300bbff6f78df075")
    default:
      return getContractInstance(jsonOptionFactory)
    }
}

module.exports = {
  getOptionFactoryInstance,
  getNetworkName,
  getOptionFactoryAbi, 
  promisify
}
