jest.mock('@google-cloud/datastore');
jest.mock('request');

const datastore = require('@google-cloud/datastore');
const request = require('request')
const model = require('../eth_events/model');
const assert = require('assert')

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

    afterAll(()=>{
        httpServer.close(() => console.log("close"));
    });
      
    it('test db case',   (done) => {
        //const stb = sinon.createStubInstance(Datastore)   
        /* model.create({myId: "long_id", block_number: "ggghggh", basis: "address_string"}, (e, d) => {
            console.log(d)
            assert.equal(d.block_number, "ggghggh")
            done()
        }) */
        done()
    });

    it('test request',   (done) => {
        request(`http://localhost:${PORT}/api/ethevents/kovan/OptionFactory/OptionTokenCreated/events`, (e, res, body) => {
            assert.ok(!e)
            assert.equal(res.statusCode, 200)
           // console.log(body)
            done()
        })
    });
})
 