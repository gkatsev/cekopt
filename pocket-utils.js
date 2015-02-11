var extend = require('util')._extend;

exports.asList = function(list) {
  return Object.keys(list).map(function(key) {
    return list[key];
  });
};

