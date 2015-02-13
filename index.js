require('es5-shim');
require('es6-shim');
var Hapi = require('hapi');
var uuid = require('node-uuid');
var Pocket = require('node-getpocket');
var readability = require('readability-api');
var extend = require('util')._extend;
var baseUrl = process.env.URL || "localhost";
var port = process.env.PORT || "8088";
var cookiePass = process.env.PASS || uuid.v4();

var redirect_url = "http://"+ baseUrl +":"+ port +"/redirect";
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

readability.configure({
  parser_token: process.env.PARSER_TOKEN
});

var server = new Hapi.Server({
  debug: {
    log: ['errors', 'hapi', 'log'],
    request: ['errors', 'hapi', 'pocket', 'log']
  }
});

server.connection({
  host: '0.0.0.0',
  port: port
});

server.route({
  method: "GET",
  path: "/",
  handler: {
    file: "./index.html"
  }
});

server.route({
  method: "GET",
  path: "/login",
  handler: function(req, reply) {
    var access_token = req.session.get('access_token');

    if (access_token) {
      req.log('log', 'Access token found. Redirecting to /app/index.html');
      return reply().redirect('/app/index.html');
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
      reply().redirect('/app/index.html');
    });
  }
});

server.route({
  method: "GET",
  path: "/app/{param}",
  handler: {
    directory: {
      path: "./app"
    }
  }
});

server.route({
  method: "GET",
  path: "/read/article",
  handler: function(req, reply) {
    var url = req.query.url;
    var parser = new readability.parser();

    parser.parse(url, function(err, data) {
      reply({
        title: data.title,
        word_count: data.word_count
      });
    });

  }
});

server.route({
  method: "GET",
  path: "/pocket/list",
  handler: function(req, reply) {
    var access_token = req.session.get('access_token');

    if (!access_token) {
      req.log('log', 'No access token found. Redirecting to /login');
      return reply().redirect('/login');
    }

    var pocket = new Pocket({
      access_token: access_token,
      consumer_key: config.consumer_key
    });
    pocket.get({
      state: "unread"
    }, function(err, res) {
      reply(res);
    });
  }
});

server.register({
  register: require('yar'),
  options: {
    maxCookieSize: 0,
    cookieOptions: {
      password: cookiePass,
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

