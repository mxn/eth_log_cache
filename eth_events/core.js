const {Keccak} = require('sha3')

const promisify = (inner) => {
  return new Promise((resolve, reject) =>
    inner((err, res) => {
      if (err) { reject(err) }
        resolve(res);
      })
    );
}

const sha3 = (toBeHashed) => {
  const hash = new Keccak(256);
  hash.update(toBeHashed)
  return '0x' + hash.digest("hex")
}

const makeKey = (network, blockNumber, transactionHash, logIndex)  => 
  sha3([network, blockNumber, transactionHash, logIndex].join(":"))


module.exports = {promisify, sha3, makeKey}