var Stream = require('stream');

var waiter = require('../src/superintendent').wait;
var series = require('../src/superintendent').series;
var parallel = require('../src/superintendent').parallel;

var q = require('q');

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;

describe('wait spec', function () {

  describe('functions returning synchronous values', function () {
    it('should fail on exception', function () {
      return expect(waiter(function () {
        throw 'err';
      })).to.eventually.be.rejectedWith('err');
    });

    it('should succeed on synchronous result', function () {
      return expect(waiter(function () {
        return 'OK';
      })).to.eventually.equal('OK');
    });
  });

  describe('functions taking callbacks', function () {

    it('should fail on a non-empty value to a callback', function () {
      return expect(waiter(function (done) {
        done('err');
      })).to.eventually.be.rejectedWith('err');
    });

    it('should succeed on a resolved promise', function () {
      return expect(waiter(function (done) {
        done(undefined, 'OK');
      })).to.eventually.equal('OK');
    });

    it('should favour returned values over callbacks', function () {
      return expect(waiter(function (done) {
        setTimeout(function () {
          done(undefined, 'callback');
        }, 10);
      })).to.eventually.equal('callback');
    });
  });

  describe('functions returning promises', function () {

    it('should fail on a failed promise', function () {
      return expect(waiter(function () {
        return q.reject('err');
      })).to.eventually.be.rejectedWith('err');
    });

    it('should succeed on a resolved promise', function () {
      return expect(waiter(function () {
        return q.when('OK');
      })).to.eventually.equal('OK');
    });
  });

  describe('streams', function () {

    it('should succeed on a stream end', function () {
      var stream = new Stream();

      var donePromise = expect(waiter(function () {
        return stream;
      })).to.be.fulfilled;

      stream.emit('end');

      return donePromise;
    });


    it('should fail on a stream error', function () {
      var stream = new Stream();

      var donePromise = expect(waiter(function () {
        return stream;
      })).to.eventually.be.rejectedWith('err');

      stream.emit('error', 'err');

      return donePromise;
    });
  });

  describe('synchronous values', function () {

    it('should succeed on synchronous result', function () {
      return expect(waiter('OK')).to.eventually.equal('OK');
    });
  });

  //TODO: tests to write:
  // - mixing return values with callbacks
});

describe('series spec', function () {

  it('should allow running tasks in series - happy path', function () {
    return expect(series(function () {
      return q.when('ONE');
    }, function(done){
      setTimeout(function(){
       done(null, 'TWO');
      });
    })).to.eventually.deep.equal(['ONE', 'TWO']);
  });


  it('should fail the whole series if one task fail', function () {
    return expect(series(function () {
      return q.when('ONE');
    }, function(done){
      setTimeout(function(){
        done('err');
      });
    })).to.eventually.be.rejectedWith('err');
  });

});

describe('parallel spec', function () {

  it('should allow running tasks in parallel - happy path', function () {
    return expect(parallel(function () {
      return q.when('ONE');
    }, function(done){
      setTimeout(function(){
        done(null, 'TWO');
      });
    })).to.eventually.deep.equal(['ONE', 'TWO']);
  });


  it('should fail the whole parallel group if one task fail', function () {
    return expect(parallel(function () {
      return q.when('ONE');
    }, function(done){
      setTimeout(function(){
        done('err');
      });
    })).to.eventually.be.rejectedWith('err');
  });

});

//TODO: cases to cover
// - once
// - meta-data: name, description
// - stats / tracing extensions through an event emmiter