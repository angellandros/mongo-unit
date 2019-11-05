'use strict';

const expect = require('chai').expect
const MongoClient = require('mongodb').MongoClient
const co = require('co')

describe('mongo-unit', function () {
  this.timeout(10000000)
  const mongoUnit = require('./index')
  const testData = {
    col1: [{doc: 1}, {doc: 2}],
    col2: [{rec: 1}, {rec: 2}]
  }

  before(() => mongoUnit.start({}))

  after(() => mongoUnit.stop())

  afterEach(() => mongoUnit.drop())

  it('should safely start mongo several time', () => {
    return mongoUnit.start()
      .then(url => {
        expect(url).to.equal(mongoUnit.getUrl())
      })
  })

  it('should connect to db and CRUD docs', () => co(function*(){
    const client = yield MongoClient.connect(mongoUnit.getUrlShort())
    const db = client.db(mongoUnit.getDbName())
    const collection = db.collection('test')
    yield collection.insert({doc: 1})
    let results = yield collection.find().toArray()
    expect(results.length).to.equal(1)
    expect(results[0].doc).to.equal(1)
    yield collection.remove({doc: 1})
    results = yield collection.find().toArray()
    expect(results.length).to.equal(0)
  }))

  it('should load collection data', () => co(function*(){
    yield mongoUnit.load(testData)
    const client = yield MongoClient.connect(mongoUnit.getUrlShort())
    const db = client.db(mongoUnit.getDbName())
    const collection1 = db.collection('col1')
    const collection2 = db.collection('col2')
    let results = yield collection1.find().toArray()
    expect(results.length).to.equal(2)
    expect(results[0].doc).to.equal(1)
    results = yield collection2.find().toArray()
    expect(results.length).to.equal(2)
    expect(results[1].rec).to.equal(2)
  }))

  it('should clean collection data', () => co(function*(){
    yield mongoUnit.load(testData)
    yield mongoUnit.clean(testData)
    const client = yield MongoClient.connect(mongoUnit.getUrlShort())
    const db = client.db(mongoUnit.getDbName())
    const collection1 = db.collection('col1')
    const collection2 = db.collection('col2')
    let results = yield collection1.find().toArray()
    expect(results.length).to.equal(0)
    results = yield collection2.find().toArray()
    expect(results.length).to.equal(0)
  }))

  it('should init DB data for given URL', () => co(function*(){
    const url = mongoUnit.getUrlShort()
    const name = mongoUnit.getDbName()
    yield mongoUnit.initDb(url, name, testData)
    const client = yield MongoClient.connect(mongoUnit.getUrlShort())
    const db = client.db(mongoUnit.getDbName())
    const collection1 = db.collection('col1')
    const collection2 = db.collection('col2')
    let results = yield collection1.find().toArray()
    expect(results.length).to.equal(2)
    results = yield collection2.find().toArray()
    expect(results.length).to.equal(2)
  }))

  it('should dropDb DB data for given URL', () => co(function*(){
    const url = mongoUnit.getUrlShort()
    const name = mongoUnit.getDbName()
    yield mongoUnit.initDb(url, name, testData)
    yield mongoUnit.dropDb(url, name)
    const client = yield MongoClient.connect(url)
    const db = client.db(name)
    const collections = yield db.listCollections().toArray()
    expect(collections.length).to.equal(0)
  }))

//   it('should list mongo',(done)=>{

//     var ps = require('ps-node');

// // A simple pid lookup
// ps.lookup({
//   psargs:['-A'],
//   command: 'mongod',
//   arguments: '.mongo-unit'

//     }, function(err, resultList ) {
//       console.log('ps', err, resultList)
//     if (err) {
//         throw new Error( err );
//     }

//     resultList.forEach(function( process ){
//         if( process ){

//             console.log( 'PID: %s, COMMAND: %s, ARGUMENTS: %s', process.pid, process.command, process.arguments );
//         }
//     });
//     done()
// });
//   })

    it('should stop mongo and start again', () => {
        return mongoUnit.stop()
            .then(() => {
                expect(mongoUnit.getUrl).to.throw(Error);
                return mongoUnit.start();
            })
            .then(url => {
                expect(url).to.equal(mongoUnit.getUrl());
            });
    });
})
