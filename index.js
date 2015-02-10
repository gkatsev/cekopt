var Hapi = require('hapi');
var Pocket = require('node-getpocket');
var extend = require('util')._extend;

var redirect_url = "http://localhost:8088/redirect";
var config = {
  "redirect_uri": redirect_url,
  "consumer_key": process.env.KEY,
};
var request_token;
var access_token;
var pocket;

if (!config.consumer_key) {
  throw new Error("No Consumer Key provided, cannot proceed");
}

pocket = new Pocket(config);

var server = new Hapi.Server({
  debug: {
    log: ['errors', 'hapi'],
    request: ['errors', 'hapi', 'pocket']
  }
});

server.connection({
  host: 'localhost',
  port: '8088'
});

server.route({
  method: "GET",
  path: "/",
  handler: function(req, reply) {

    pocket.getRequestToken({
      redirect_uri: redirect_url
    }, function(err, res, body) {
      if (err) {
        req.log('errors', err);
        return reply(err.message);
      }

      var json = JSON.parse(body);
      request_token = json.code;
      req.log('pocket', request_token);
      var url = pocket.getAuthorizeURL(extend({
        request_token: request_token
      }, config));
      req.log('pocket', url);
      reply().redirect(url);
    });
  }
});

server.route({
  method: "GET",
  path: "/redirect",
  handler: function(req, reply) {
    pocket.getAccessToken(extend({
      request_token: request_token
    }, config), function(err, res, body) {
      if (err) {
        req.log('errors', err);
        return reply(err.message);
      }

      var json = JSON.parse(body);
      access_token = json.access_token;
      reply().redirect('/list');
    });
  }
});

server.route({
  method: "GET",
  path: "/list",
  handler: function(req, reply) {
    var pocket = new Pocket({
      access_token: access_token,
      consumer_key: config.consumer_key
    });
    pocket.get({
      state: "unread"
    }, function(err, res) {
      reply(JSON.stringify(res, null, 2));
    });
  }
});

server.start()
