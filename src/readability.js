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
parser = new readability.parser();

article = Promise.promisify(parser.parse, parser)
confidence = Promise.promisify(parser.confidence, parser);

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
