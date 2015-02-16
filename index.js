require('es5-shim');
require('es6-shim');
var Hapi = require('hapi');
var uuid = require('node-uuid');
var Pocket = require('node-getpocket');
var readability = require('readability-api');
var baseUrl = process.env.URL || "localhost";
var port = process.env.PORT || "8088";
var cookiePass = process.env.PASS || uuid.v4();

var loginHandler = require('./src/login.js');

var redirect_url = "http://"+ baseUrl +":"+ port +"/redirect";
var config = {
  "redirect_uri": redirect_url,
  "consumer_key": process.env.KEY,
};
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
    log: ['error', 'hapi', 'log', 'handler'],
    request: ['error', 'hapi', 'pocket', 'log', 'handler']
  }
});

server.connection({
  host: '0.0.0.0',
  port: port
});

loginHandler(server, pocket, config, redirect_url);

server.route({
  method: "GET",
  path: "/",
  handler: {
    file: "./index.html"
  }
});

server.route({
  method: "GET",
  path: "/app/{param}",
  handler: {
    directory: {
      path: "./app"
    }
  },
  config: {
    pre: [
      {method: loginHandler.verifyLogin, assign: 'verifyLogin'}
    ]
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
  },
  config: {
    pre: [
      {method: loginHandler.verifyLogin, assign: 'verifyLogin'}
    ]
  }
});

server.route({
  method: "GET",
  path: "/pocket/list",
  handler: function(req, reply) {
    var access_token = req.session.get('access_token');
    var pocket = new Pocket({
      access_token: access_token,
      consumer_key: config.consumer_key
    });
    pocket.get({
      state: "unread"
    }, function(err, res) {
      reply(res);
    });
  },
  config: {
    pre: [
      {method: loginHandler.verifyLogin, assign: 'verifyLogin'}
    ]
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

