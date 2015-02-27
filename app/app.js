require('es5-shim');
require('es6-shim');

var wcToMins = 250;
var request = require('request');
var url = require('url');
var document = require('global/document');
var utils = require('../utils.js');
var datalist = [];

var orderingRadios = document.querySelector('.ordering-group');
var filter = document.querySelector('.filter');

var timer;
filter.onkeydown = filter.onkeyup = filter.onclick = function() {
  if (timer) {
    clearTimeout(timer);
  }

  timer = setTimeout(displayList, 100);
};

var displayList = function() {
  var ol = document.createElement('ol');
  var placeholder = document.querySelector('.placeholder');
  var ordering = document.querySelector('.ordering:checked').value;
  var val = filter.value && JSON.parse(filter.value);

  datalist
  .filter(function(item) {
    var wc = item.readability.word_count / wcToMins;
    if (!val) {
      return true;
    }

    return (wc < val + 3) && (wc > val - 3);
  })
  .sort(function(a, b) {
    if (ordering === 'asc') {
      return a.readability.word_count - b.readability.word_count;
    }

    return b.readability.word_count - a.readability.word_count;
  })
  .forEach(function(item) {
    var li = document.createElement('li');
    var a = document.createElement('a');

    a.textContent = item.resolved_title || item.readability.title || item.resolved_url;
    a.href = item.resolved_url;
    li.appendChild(document.createTextNode('['+ item.readability.word_count +'] '));
    li.appendChild(document.createTextNode('['+ item.readability.word_count/wcToMins +' mins] '));
    li.appendChild(a);
    ol.appendChild(li);
  });

  while(placeholder.firstChild) {
    placeholder.removeChild(placeholder.firstChild);
  }
  document.querySelector('.placeholder').appendChild(ol);
}

var doWork = function(json) {
  datalist = json.list
  displayList();
};

orderingRadios.addEventListener('click', displayList);

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

