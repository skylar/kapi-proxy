// IMPORTS
var kiva = require('./kivaClient');
var store = require('./dataStore');
var google = require('./googleTranslate');
var json = require('json');

// DATA
var db = require('./keyDb').db();
db.init('loans.db');

exports.stringDataForLoans = function(ids, callback) {
	db.retrieve(ids, callback);
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
				}
				db.store(loan.id, json.stringify(object));
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
			db.store(loan.id, loan);
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
					db.store(batch.id, json.stringify(object));
//					console.log('How about that! I translated something.');
				}
			});
		}
	});
}
