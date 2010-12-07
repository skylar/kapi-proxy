// IMPORTS
var kiva = require('./kivaClient');
var store = require('./dataStore');
var google = require('./googleTranslate');
var json = require('json');

// DATA
var cacheDb = {};
var db = require('./keyDb').db();
db.init('loans.db');

exports.stringDataForLoans = function(ids, callback) {
	var subset = [], data = [];
	
	ids.forEach( function(id) {
		if(cacheDb.hasOwnProperty(id)) {
			data.push({k: id, v: cacheDb[id] });
		} else { subset.push(id); }
	})
	if(subset.length === 0) { callback(data); }
	else {
//		console.log("going to the DB for this one...")
		db.retrieve(subset, function(rows) {
			callback(data.concat(rows));
		});
	}
}

exports.cacheLoansBySummary = function(loans) {
	var countdown = loans.length, subset = [];
	
	// figure out which we don't have - only get those
	loans.forEach(function(loan) {
		db.retrieveOne(loan.id,function(data) {
			var object;
			if(data) {
				object = json.parse(data);
				// update basket & funded amounts, if necessary
				if(object && loan && (object.basket_amount != loan.basket_amount || object.funded_amount != loan.funded_amount)) { 
					object.basket_amount = loan.basket_amount;
					object.funded_amount = loan.funded_amount;
					_storeLoanCacheProxy(loan.id, json.stringify(object));
				} else {
					cacheDb[loan.id] = data;
				}
			}
			else { subset.push(loan.id); }
			countdown--;
			if(countdown <= 0) {
//				console.log("Loans omitted: " + (ids.length - subset.length));
				kiva.fetchLoanDetail(subset,_didFindLoans);
			}
		});
	})
};

// updates the loan in our poor-man's proxy
//  as well as the db.
var _storeLoanCacheProxy = function(id,data) {
	cacheDb[id] = data;
	db.store(id, data);
}

var _didFindLoans = function(response) {	
	if(response.loans) {
		var loans = response.loans
			, uses = []; // todo: descriptions
		
		// prepare use txt for translation
		loans.forEach( function(loan) {
			if(loan.id && loan.use) {
				uses.push({string:loan.use, id:loan.id});
			}
		});
		google.translate(uses, _translationHandler);
		
		// store the data
		loans.forEach( function(loan) {
			_storeLoanCacheProxy(loan.id, loan);
		});
	}
};

var _translationHandler = function(batches) {
	batches.forEach( function(batch) {
		if(batch.translation) {
			// fetch the data from sqlite, de-serialize, add prop, re-serialize
			db.retrieveOne(batch.id, function(data) {
				var object;
				if(data) {
					object = json.parse(data);
					object.use_intl = {texts:{fr:batch.translation}};
					_storeLoanCacheProxy(batch.id, json.stringify(object));
//					console.log('How about that! I translated something.');
				}
			});
		}
	});
}
