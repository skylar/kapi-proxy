// IMPORTS
var json = require('json');
var http = require('http');

// CONSTANTS
var apiHost = "api.kivaws.org";
var loanListMethod = "/v1/loans/newest.json";

// METHODS
exports.fetchPage = function(pageNumber, callback) {
	var httpClient = http.createClient(80, apiHost);
	var method = loanListMethod + "?page=" + pageNumber.toString(10);
	console.log(method);
	
	var request = httpClient.request('GET', method, {'host':apiHost});
	request.end();
	
	request.on('response', function(response) {
		var totalResponse = '';
		response.setEncoding('utf8');
		response.on('data', function(chunk) {
			totalResponse += chunk;
		});
		response.on('end', function(chunk) {
			var jsonResponse = json.parse(totalResponse);
			callback(jsonResponse);
		});		
	});
};

