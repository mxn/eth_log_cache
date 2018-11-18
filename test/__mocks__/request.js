(function () {
  function request (arg, cb) {

    console.log("calles")
    let body = require('../data/web3ethLogsResponseBody.json')
    let res = {body: body, statusCode: 200}
    cb(null, res, body)
  }
  module.exports = request
 }) ()
  



