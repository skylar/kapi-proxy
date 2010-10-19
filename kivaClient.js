// IMPORTS
var json = require('json');
var http = require('http');

// CONSTANTS
var apiHost = "api.kivaws.org";
var loanListMethod = "/v1/loans/newest";
var loanDetailMethod = "/v1/loans/";
var appId = "org.kivaenfrancais.kapi-proxy";

// METHODS
exports.fetchPage = function(pageNumber, callback) {
	sendApiRequest(loanListMethod,
		{page:pageNumber.toString(10)}, callback);
};

exports.fetchLoanDetail = function(loanIds, callback) {
	sendApiRequest(loanDetailMethod + loanIds.join(','),
		{},callback);
}

var sendApiRequest = function(method,parameters,callback) {
	var httpClient = http.createClient(80, apiHost),
		preParams = [],
		request;
	if(!parameters) { parameters = {};}
	parameters['app_id'] = appId;
	
	method += ".json?" + require('querystring').stringify(parameters);
//	console.log("Requesting " + method);
	
	request = httpClient.request('GET', method, {'host':apiHost});
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
}