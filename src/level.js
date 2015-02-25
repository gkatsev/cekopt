var Promise = require('bluebird');
var level = require('level');

db = Promise.promisifyAll(level('./readability.db'));

exports.get = function get(key) {
  return db.getAsync(key)
  .then(JSON.parse)
  .then(function(data) {
    console.log('Read %s from cache', key);
    return data;
  });
};

exports.put = function put(key, value) {
  return Promise.resolve(value)
  .then(JSON.stringify)
  .then(function(value) {
    return db.putAsync(key, value);
  })
  .then(function() {
    console.log('Wrote %s to cache', key);
  });
};
