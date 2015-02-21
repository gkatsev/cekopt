var Promise = require('bluebird');
var readability = require('readability-api');
var verifyLogin = require('./login.js').verifyLogin;
var utils = require('../utils.js');
var article;
var confidence;
var parser;

readability.configure({
  parser_token: process.env.PARSER_TOKEN
});
parser = Promise.promisifyAll(new readability.parser());

article = function(url) {
  return Promise.resolve(parser)
  .call('requestAsync', 'GET', '/parser', {url: url});
};
confidence = function(url) {
  return Promise.resolve(parser)
  .call('requestAsync', 'GET', '/confidence', {url: url})
  .spread(function(res, body) {
    if (body.confidence) {
      return [res, body.confidence];
    }

    return [res, body];
  });
};

module.exports = function(server) {
  server.route({
    method: "GET",
    path: "/read/article",
    handler: function(req, reply) {
      var url = req.query.url;

      article(url)
      .then(utils.extractTileWordCount)
      .catch(function(e) {
        req.log('error', e);
      })
      .then(function(r) {
        reply(r)
      });
    },
    config: {
      pre: [
        {method: verifyLogin, assign: 'verifyLogin'}
      ]
    }
  });
};

module.exports.article = article;
module.exports.confidence = confidence;
