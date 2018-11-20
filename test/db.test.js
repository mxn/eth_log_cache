const datastore = require('@google-cloud/datastore');
const model = require('../eth_events/model');
const assert = require('assert')
const {getJsonRequest} = require('../eth_events/web3-facade.js')
 
const app = require('../app.js')


var httpServer
const PORT = 9876
describe('test suit', () => {
    process.env.GCLOUD_PROJECT = 'project-id'; // Set the datastore project Id globally
    beforeAll(function () {
        httpServer = app.listen(PORT, (e, d) =>  {
            if (e) {
                console.error("error",e);
            } else {
                console.error(`listening port ${PORT}`);
            }
        })
      
    });
    beforeEach(() => {
        jest.resetModules();
      });

    afterAll(()=>{
        httpServer.close(() => console.log("Server is closed"));
    });
      
   
    it('test request without mock',   (done) => {   
        const request = require('request')
        request(`http://localhost:${PORT}/api/ethevents/kovan/OptionFactory/OptionTokenCreated/events`, (e, res, body) => {
            expect(e).toBeNull()
            expect(res.statusCode).toBe(200)
            expect(JSON.parse(res.body).length).toBeGreaterThan(0)
            expect(JSON.parse(res.body).length).toBe(3)      
            done()
        })
    }, 10000)

    it('test request',   (done) => {
        const mockResponseBody = require('./data/web3ethLogsResponseBody.json')
        jest.doMock('request',  () => {
            return jest.fn ((arg, cb) => {     
              let res = {body: mockResponseBody, statusCode: 200}
              cb(null, res, mockResponseBody)
            })
        })
        const request = require('request')

        request(`http://localhost:${PORT}/api/ethevents/kovan/OptionFactory/OptionTokenCreated/events`, (e, res, body) => {
            expect(e).toBeNull()
            expect(res.statusCode).toBe(200)
            done()
        })
    })

    it('request should be properly encoded', (done) => {
        let res = getJsonRequest('kovan', 'OptionFactory', 'OptionTokenCreated', 8)
        expect(JSON.parse(res).params.length).toBeGreaterThan(0)
        expect(JSON.parse(res).params.fromBlock === 8)
        done()
    })

    it('test db case',  async (done) => {
        let entries = require('./data/converted_logs.json')
        let d = await model.store("kovan", "OptionTokenCreated", entries[0])
        expect(d).toBeDefined()
        done()
    })

    it('list should return something', async (done) => {
        model.list('kovan','OptionTokenCreated', 100, 0, null, (e, d, hasNext) => {
            expect(e).toBeNull()
            expect(d).toBeDefined()
            expect(d.length).toBeGreaterThan(0)
            done()
        })
    })

    it('should get lastBlockNumber',  (done) => {
        model.lastSeenBlockNumber('kovan','OptionTokenCreated', (e, d) => {
            expect(e).toBeNull()
            expect(d).toBeGreaterThan(0)
            console.log("blockNumber", d)
            done()
        })
    })

})
 