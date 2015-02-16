var readability = require('readability-api');
var verifyLogin = require('./login.js').verifyLogin;

readability.configure({
  parser_token: process.env.PARSER_TOKEN
});


module.exports = function(server) {
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
        {method: verifyLogin, assign: 'verifyLogin'}
      ]
    }
  });
};
