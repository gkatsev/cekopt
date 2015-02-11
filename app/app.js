require('es5-shim');
require('es6-shim');

var request = require('request');
var document = require('global/document');
var pocket = require('../pocket-utils.js');

var displayList = function(list) {
  var ol = document.createElement('ol');

  list.forEach(function(item) {
    var li = document.createElement('li');
    var a = document.createElement('a');

    a.textContent = item.resolved_title || item.resolved_url;
    a.href = item.resolved_url;
    li.appendChild(a);
    ol.appendChild(li);
  });

  document.body.appendChild(ol);
}

var doWork = function(json) {
  var list = pocket.asList(json.list);
  displayList(list);
};

request({
  url: '/list',
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

