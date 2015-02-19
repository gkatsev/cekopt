var Promise = require('bluebird');
var extend = require('util')._extend;

exports.asList = function(list) {
  return Object.keys(list).map(function(key) {
    return list[key];
  });
};

exports.extractTileWordCount = function(data) {
  return {
    title: data.title || '',
    word_count: data.word_count || 0
  };
};

exports.retry = function retry(f, n) {
  return f(n).then(
    undefined,
    function(err) {
      console.error(err);
      if (n) {
        return retry(f, n-1)
      }
      return Promise.reject(err);
    })
};
