//const datastore = require('@google-cloud/datastore');
const Emulator = require('google-datastore-emulator');
const model = require('../eth_events/model');
//const Datastore = require('@google-cloud/datastore')

const sinon = require('sinon');
const assert = require('assert')
const request = require('request')
const app = require('../app.js')


/* const options = {
    legacy: false, // if you need legacy support
    useDocker: false // if you need docker image
}; */
var emulator, httpServer
const PORT = 9876
describe('test suit', () => {
    process.env.GCLOUD_PROJECT = 'project-id'; // Set the datastore project Id globally
    before(function () {
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
        emulator = new Emulator(options);
    });

    after(()=>{
        httpServer.close(()=> console.log("close"));
        return emulator.stop();
    });
    
    /* before(()=>{
          const options = {
            legacy: false, // if you need legacy support
            useDocker: false // if you need docker image
        };
        
        emulator = new Emulator(options);
        var start =  emulator.start();
        console.log("started");
        return start;           
    }); */

/*     before(()=>{
             
    });
    
    after(()=>{
        //return emulator.stop();
    }); */
    
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
        request(`http://localhost:${PORT}`, (e, res, body) => {
            if (e) {
                console.error("error", e)
                assert.ok(false, e)
                done()
                return
            } 
            console.log(body)
            done()
        })
    });
})
 