require('es5-shim');
require('es6-shim');

var request = require('request');
var url = require('url');
var document = require('global/document');
var utils = require('../utils.js');

var displayList = function(list) {
  var ol = document.createElement('ol');

  list.sort(function(a, b) {
    return a.word_count - b.word_count;
  }).forEach(function(item) {
      var li = document.createElement('li');
      var a = document.createElement('a');

      a.textContent = item.resolved_title || item.readability.title || item.resolved_url;
      a.href = item.resolved_url;
      li.appendChild(document.createTextNode('['+ item.readability.word_count +'] '));
      li.appendChild(document.createTextNode('['+ item.readability.word_count/250 +' mins] '));
      li.appendChild(a);
      ol.appendChild(li);
    //});

  });

  document.body.appendChild(ol);
}

var doWork = function(json) {
  //var list = utils.asList(json.result.list);
  var list = json.list
  displayList(list);
};

request({
  url: '/pocket/list',
  json: true
}, function(err, res, body) {
  if (err) {
    throw err;
  }
  if (res.statusCode === 200) {
    return doWork(body);
  }

  throw new Error("Weird response from server-side: " + res.statusCode);
});

