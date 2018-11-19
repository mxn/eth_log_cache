const datastore = require('@google-cloud/datastore');
const model = require('../eth_events/model');
const assert = require('assert')
const {getJsonRequest} = require('../eth_events/web3-facade.js')
 
const app = require('../app.js')


/* const options = {
    legacy: false, // if you need legacy support
    useDocker: false // if you need docker image
}; */
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
      
        const options = {
            dataDir: "/tmp/datastore-emulator",
            clean: true,
            legacy: false, // if you need legacy support
            useDocker: false // if you need docker image
        };
    });
    beforeEach(() => {
        jest.resetModules();
      });

    afterAll(()=>{
        httpServer.close(() => console.log("close"));
    });
      
   
    it('test request without mock',   (done) => {
        
        const request = require('request')

        request(`http://localhost:${PORT}/api/ethevents/kovan/OptionFactory/OptionTokenCreated/events`, (e, res, body) => {
            expect(e).toBeNull()
            expect(res.statusCode).toBe(200)
            expect(JSON.parse(res.body).length).toBeGreaterThan(0)
            done()
        })
    })

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

    it('request should be properly encoded', () => {
        let res = getJsonRequest('kovan', 'OptionFactory', 'OptionTokenCreated', 8)
        expect(JSON.parse(res).params.length).toBeGreaterThan(0)
    })

    it('test db case',   (done) => {
        /* model.create({myId: "long_id", block_number: "ggghggh", basis: "address_string"}, (e, d) => {
            console.log(d)
            assert.equal(d.block_number, "ggghggh")
            done()
        })  */
        done()
    });

})
 