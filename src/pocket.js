var Pocket = require('node-getpocket');
var verifyLogin = require('./login.js').verifyLogin;

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
      pocket.get({
        state: "unread"
      }, function(err, res) {
        reply(res);
      });
    },
    config: {
      pre: [
        {method: verifyLogin, assign: 'verifyLogin'}
      ]
    }
  });
};
