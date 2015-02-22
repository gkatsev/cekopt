var Boom = require('boom');
var Promise = require('bluebird');
var Pocket = require('node-getpocket');
var verifyLogin = require('./login.js').verifyLogin;
var article = require('./readability.js').article;
var utils = require('../utils.js');

var addReadabilityInfo = function(list) {
  return Promise.map(list.map(function(item) {
    return item.resolved_url;
  }), function(url, i) {
    return utils.retry(function(n) {
      console.log(n, url);
      return article(url)
      .catch(function(e) {
        return Promise.reject(e);
      })
      .catch(function() {
        return [{
          statusCode: 404,
          statusMessage: 'Could not make a request'
        }]
      })
      .spread(function(res, data) {
        if (res.statusCode < 200 && res.statusCode > 300) {
          console.error(url, res.statusCode, data);
          return Promise.reject(new Error(res.statusMessage));
        }

        return data;
      });
    }, 3)
    .then(function(data) {
      if (data.error) {
        return Promise.reject(new Error(data.messages));
      }

      return data;
    })
    .catch(function(e) {
      // if we got here, there was an issue with readability
      // either couldn't get data or we exceeded hourly allowance.
      // We still want to return the list of items to the client,
      // so, just return an empty object here, which will default
      // word_count to zero.
      return {};
    })
    .then(utils.extractTileWordCount)
    .then(function(data) {
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
        var list = utils.asList(res.list);
        return addReadabilityInfo(list)
        .then(function(list) {
          return [res, list];
        })
      })
      .spread(function(res, list) {
        reply({
          result: res,
          list: list
        });
      })
      .catch(function(e) {
        reply(Boom.wrap(e, 502));
      });
    },
    config: {
      pre: [
        {method: verifyLogin, assign: 'verifyLogin'}
      ]
    }
  });

  server.route({
    method: 'GET',
    path: '/pocket/test',
    handler: function(req, reply) {
      var fs = require('fs');
      var outputStream = fs.createReadStream('./output.json');
      reply(outputStream);
    }
  });
};
