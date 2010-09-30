// REQUIRES
var http = require('http');
var json = require('json');
var crawler = require('./idCrawler');
var store = require('./dataStore');

// CONSTANTS
var refreshRate = 5*60*1000;

// START crawler
var onIndexUpdateComplete = function() {
	console.log("Index update complete. Total loans: " + store.getIds().length);
	setTimeout(function() {crawler.updateIdIndex(onIndexUpdateComplete);}, refreshRate);
}

crawler.updateIdIndex(onIndexUpdateComplete);

// START simple API server
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(json.stringify(store.getIds()));
}).listen(8124, "127.0.0.1");

console.log('Server running at http://127.0.0.1:8124/');