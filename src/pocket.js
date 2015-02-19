var Promise = require('bluebird');
var Pocket = require('node-getpocket');
var verifyLogin = require('./login.js').verifyLogin;
var article = require('./readability.js').article;
var utils = require('../utils.js');

var addReadabilityInfo = function(list) {
  return Promise.map(list.map(function(item) {
    return item.resolved_url;
  }), function(url, i) {
    return article(url)
    .then(utils.extractTileWordCount)
    .then(function(data) {
      console.log(data);
      list[i].readability = data;
      return list[i];
    });
  });
};

module.exports = function(server, config) {
  server.route({
    method: "GET",
    path: "/pocket/list",
    handler: function(req, reply) {
      var access_token = req.session.get('access_token');
      var pocket = new Pocket({
        access_token: access_token,
        consumer_key: config.consumer_key
      });
      var get = Promise.promisify(pocket.get, pocket);
      get({
        state: 'unread'
      })
      .then(function(res) {
        // just use 10 items for now for testing
        var list = utils.asList(res.list).slice(-10);
        return [res, addReadabilityInfo(list)];
      })
      .spread(function(res, list) {
        reply({
          result: res,
          list: list
        });
      })
      .catch(function(e) {
        req.log('error', e);
      });
    },
    config: {
      pre: [
        {method: verifyLogin, assign: 'verifyLogin'}
      ]
    }
  });
};
