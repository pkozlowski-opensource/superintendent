var q = require('q');
var eos = require('end-of-stream');

function createDoneCb(deferred) {
  return function (err, result) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(result);
    }
  };
}

function isAStream(candidate) {
  return typeof candidate === 'object' && candidate.pipe;
}

/**
 *
 * @param depsFn a function to wait for. It can signal its completion by:
 *          - invoking a supplied callback
 *          - returning a promise
 *          - returning a stream
 *          - throwing an exception
 *          TODO(?): - waiting for a process to exit
 * @return a promise? a callback?
 */
module.exports.wait = function (depsFn) {

  var deferred = q.defer();

  try {
    var result = typeof depsFn === 'function' ? depsFn(createDoneCb(deferred)) : depsFn;
    if (result !== undefined) {

      //is it a stream?
      if (isAStream(result)) {
        eos(result, function (err) {
          err ? deferred.reject(err) : deferred.resolve();
        });
      } else {
        //if not assume it is a value to be returned or a promise
        deferred.resolve(result);
      }
    } else {
      // it might happen that a callback is never called here
      // should I have a timeout for such a situation?
    }

  } catch (e) {
    deferred.reject(e);
  }

  return deferred.promise;
};

module.exports.parallel = function () {
  var argsArray = Array.prototype.slice.call(arguments);

  var promisesArray = argsArray.map(function (depsFn) {
    return module.exports.wait(depsFn);
  });

  return q.all(promisesArray);
};

module.exports.series = function () {
  var argsArray = Array.prototype.slice.call(arguments);

  return argsArray.reduce(function (soFar, taskFn) {
    return soFar.then(function (resultsArr) {
      return module.exports.wait(taskFn).then(function (result) {
        resultsArr.push(result);
        return resultsArr;
      });
    });
  }, q.when([]));

};