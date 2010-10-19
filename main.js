// REQUIRES
var http = require('http');
var json = require('json');
var crawler = require('./idCrawler');
var store = require('./dataStore');
var cacher = require('./loanCacher');

// CONSTANTS
var refreshRate = 5*60*1000;
var portNumber = 5482; // k-i-v-a

// START crawler
var onIndexUpdateComplete = function() {
	console.log("Index update complete. Total loans: " + store.getIds().length);
	setTimeout(function() {crawler.updateIdIndex(onIndexUpdateComplete, onIndexUpdateProgress);}, refreshRate);
};

var onIndexUpdateProgress = function(ids) {
//	console.log("Found IDs: " + ids);
	cacher.cacheLoansById(ids);
};

var sendArrayAsJsonResponse = function(arr, res) {
	res.writeHead(200, {'Content-Type': 'application/json'});
	res.end(json.stringify(arr));
	console.log('Response sent.');
}

crawler.updateIdIndex(onIndexUpdateComplete, onIndexUpdateProgress);

// START simple API server
http.createServer(function (req, res) {
	var url = require('url').parse(req.url, true),
		ids, loans = [];
	
	if(url.pathname === '/a/loans/fundraising/ids.json') {
		sendArrayAsJsonResponse(store.getIds(), res);
	} else if (url.pathname.slice(0,9) === '/a/loans/') {
		ids = url.pathname.slice(9);
		ids = ids.split('.');
		if(ids[0]) {
			ids = ids[0].split(',');
			ids.forEach( function(id) {
				if(store.getLoanData(id)) {
					loans.push(store.getLoanData(id));
				}
			})
		}
		sendArrayAsJsonResponse(loans, res);
	} else {
		sendArrayAsJsonResponse({error:'Unknown Method'}, res);
	}
}).listen(5482);

console.log('Server running on port ' + portNumber);
