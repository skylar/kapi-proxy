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
	var ids = store.getIds();
	console.log("Index update complete. Total loans: " + ids.length);
	cacher.clearCache(ids);
	setTimeout(function() {crawler.updateIdIndex(onIndexUpdateComplete, onIndexUpdateProgress);}, refreshRate);
};

var onIndexUpdateProgress = function(loans) {
//	console.log("Found IDs: " + ids);
	cacher.cacheLoansBySummary(loans);
};

var sendDataAsJsonResponse = function(data, res) {
	if('string' !== typeof(data)) { data = json.stringify(data);  }
	
	res.writeHead(200, {'Content-Type': 'application/json'});
	res.end(data);
}

crawler.updateIdIndex(onIndexUpdateComplete, onIndexUpdateProgress);

// START simple API server
http.createServer(function (req, res) {
	var url = require('url').parse(req.url, true),
		ids, loans = [];
	
	if(url.pathname === '/a/loans/fundraising/ids.json') {
		sendDataAsJsonResponse(store.getIds(), res);
	} else if (url.pathname.slice(0,9) === '/a/loans/') {
		ids = url.pathname.slice(9);
		ids = ids.split('.');
		if(ids[0]) {
			ids = ids[0].split(',');
			cacher.stringDataForLoans(ids, function(rows) {
//				console.log('returning ROWS of ' + rows.length);
				var first = true;
				res.writeHead(200, {'Content-Type': 'application/json'});
				rows.forEach(function(row) {
//					loans.push(row.v);
					if(first) { res.write('[' + row.v); }
					else { res.write(',' + row.v); }
					first = false;
				});
				return res.end(']');
//				return sendDataAsJsonResponse('['+loans.join(',')+']', res);
			})
		} else {
			sendDataAsJsonResponse([], res);
		}
	// } else if (url.query && url.query.q) {
	// 	// TRANSLATION TESTING
	// 	require('./googleClient').translate(url.query.q.split(','), 
	// 		function(t) { console.log(t); 
	// 			sendDataAsJsonResponse(t, res);
	// 		})
	} else {
		sendDataAsJsonResponse({error:'Unknown Method'}, res);
	}
}).listen(5482);

console.log('Server running on port ' + portNumber);
