var extend = require('util')._extend;
var Pocket = require('node-getpocket');
var request_token;

var verifyLogin = function(req, reply) {
  var access_token = req.session.get('access_token');

  req.log('log', 'verifying login. Route: ' + req.path);

  if (!access_token) {
    req.log('log', 'Access token not found. Redirecting to /login to log in');
    return reply().takeover().redirect('/login');
  }

  reply();
};

module.exports = function(server, config, redirect_url) {
  var pocket = new Pocket(config);

  server.route({
    method: "GET",
    path: "/login",
    handler: function(req, reply) {
      var access_token = req.session.get('access_token');

      if (access_token) {
        req.log('log', 'Access token found. Redirecting to /app/index.html');
        req.log('log', 'Route: ' + req.path);
        return reply().takeover().redirect('/app/index.html');
      }

      pocket.getRequestToken({
        redirect_uri: redirect_url
      }, function(err, res, body) {
        if (err) {
          req.log('error', err);
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
      req.log('log', 'Accepting redirect');

      pocket.getAccessToken(extend({
        request_token: request_token
      }, config), function(err, res, body) {
        req.log('trying to access token');
        if (err) {
          req.log('error', err);
          return reply(err.message);
        }

        var json = JSON.parse(body);
        var access_token = json.access_token;
        req.session.set('access_token', access_token);
        reply().redirect('/app/index.html');
      });
    },
    config: {
      pre: [{
        method: function(req, reply) {
          req.log('log', 'verifying login for /redirect. ' + request_token);
          if (!request_token) {
            req.log('log', 'We did not get here from /login. So, redirecting there to login');
            return reply().takeover().redirect('/login');
          }
          reply();
        },
        assign: 'verifyLogin'
      }]
    }
  });
};

module.exports.verifyLogin = verifyLogin;
