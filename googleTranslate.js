// IMPORTS
var json = require('json');
var http = require('http');
var tasks = require('tasks');
var keys = require('./private/googleApiKeys');

// CONSTANTS
var apiHost = "www.googleapis.com";
var translateMethod = "/language/translate/v2";
var apiKey = keys.testApiKey; //"just_testing"; // or chose from keys import above
var defaultParameters = {format:'html',source:'en',target:'fr',key:apiKey};
var contentUrlEncoded = 'application/x-www-form-urlencoded';
var translationRequestOverhead = 3;
var translationRequestMaxSize = 4900; /// 5000, but just to be safe...

// DATA
var queue = require('tasks').queue("google",2);
var db = require('./keyDb').db();
db.init('google_translate.db');

// METHODS
exports.translate = function(requests, callback) {
	var countdown = requests.length, easyBatch = [];
	var sha1;
	
//	console.log("Pre-processing translate request of size: " + requests.length);
	// first, get strings we can from the db
	requests.forEach(function(request) {
		sha1 = require('crypto').createHash('sha1');
		sha1.update(request.string.toLowerCase());
		request.hash = sha1.digest('base64');
		
		db.retrieveOne(request.hash, function(data) {
			if(data) {
				request.translation = data;
				easyBatch.push(request);
			}
			countdown--;
			// once all the db fetches have come back
			if(countdown <= 0) {
				// send on the already-translated entries
//			console.log('done w/ db entries');
				callback(easyBatch);
				// ask google to do the work for the rest
				_fetchUntranslatedEntries(requests, callback);
			}
		});
	});
}


var _fetchUntranslatedEntries = function(requests, callback) {
	var charCount = 0, batch = [];	

	// TODO: trunchate any one request > 5000 chars (otherwise we loop forever)
	requests.forEach( function(request) {
		if(!request.hasOwnProperty('translation')) {
			// split request into batches of < 5000 characters (larger requests are rejected)
			if(request.string.length + charCount + translationRequestOverhead > translationRequestMaxSize) {
				_sendBatch(batch, callback);
				batch = [];
				charCount = 0;
			}
			batch.push(request);
			charCount += request.string.length + translationRequestOverhead;
		}
	});
	if(batch.length) { _sendBatch(batch, callback); }
};

var _sendBatch = function(batch, callback) {
	var p = defaultParameters, strings = [];
	
	batch.forEach(function(b) { strings.push(b.string); });
	queue.push(function(t) {
		sendApiRequest(translateMethod,p
			,require('querystring').stringify({q:strings},'&','=',false)
			,function(translations) {
				var k;
				// translations should come back in the same order sent
				for(k=0;k<translations.length;k++) {
					batch[k].translation = translations[k];
					db.store(batch[k].hash, translations[k]);
				}
				callback(batch); t.done(); 
			});
		// whew, we finally sent a request 
	});
}

var _postProcessTranslation = function(response, callback) {
	var texts = [];
	if(!response || !response.data || !response.data.translations) { 
		console.log("Failed to get translation! (response code: " + response.error.code + ") " + response.error.message);
		return callback(t);
	}
	
	response.data.translations.forEach( function(hash) {
		texts.push(hash.translatedText);
	});
	callback(texts);
}

var sendApiRequest = function(method,parameters,body,callback) {
	var httpClient = http.createClient(443, apiHost, true),
		preParams = [],
		request;
	if(!parameters) { parameters = {};}
	method += "?" + require('querystring').stringify(parameters,'&','=',false);
	
	// we can send more data if we POST
	request = httpClient.request('POST', method, {'Host':apiHost,
		'Content-Type':contentUrlEncoded,'Referer':'http://kivaenfrancais.org/',
		'X-HTTP-Method-Override':'GET'});
	request.end(body);
	
	request.on('response', function(response) {
		var totalResponse = '';
		response.setEncoding('utf8');
		response.on('data', function(chunk) {
			totalResponse += chunk;
		});
		response.on('end', function(chunk) {
			if(response.statusCode === 200) {
				var jsonResponse = json.parse(totalResponse);
//				console.log("Response SUCCESS with code: " + response.statusCode);
				_postProcessTranslation(jsonResponse, callback);
			} else {
//				console.log("Response ERROR with code " + response.statusCode + " (message: "+ totalResponse +")");
				callback([]);
			}
		});
	});
}