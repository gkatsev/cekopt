var Hapi = require('hapi');
var uuid = require('node-uuid');
var Pocket = require('node-getpocket');
var extend = require('util')._extend;

var redirect_url = "http://localhost:8088/redirect";
var config = {
  "redirect_uri": redirect_url,
  "consumer_key": process.env.KEY,
};
var request_token;
var pocket;

if (!config.consumer_key) {
  throw new Error("No Consumer Key provided, cannot proceed");
}

pocket = new Pocket(config);

var server = new Hapi.Server({
  debug: {
    log: ['errors', 'hapi', 'log'],
    request: ['errors', 'hapi', 'pocket', 'log']
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
    var access_token = req.session.get('access_token');

    if (access_token) {
      req.log('log', 'Access token found. Redirecting to /list');
      return reply().redirect('/list');
    }

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
      req.log('log', 'Redirectiong to auth url');
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
      var access_token = json.access_token;
      req.session.set('access_token', access_token);
      reply().redirect('/list');
    });
  }
});

server.route({
  method: "GET",
  path: "/list",
  handler: function(req, reply) {
    var access_token = req.session.get('access_token');

    if (!access_token) {
      req.log('log', 'No access token found. Redirecting to /');
      return reply().redirect('/');
    }

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

server.register({
  register: require('yar'),
  options: {
    maxCookieSize: 0,
    cookieOptions: {
      password: uuid.v4(),
      clearInvalid: true,
      isSecure: false
    }
  }
}, function(err) {
  if (err) {
    return console.log(err);
  }

  server.start()
});

