// IMPORTS
var kiva = require('./kivaClient');
var store = require('./dataStore');

// CONSTANTS
var pageSize = 10;

exports.cacheLoansById = function(ids) {
	var k=0,length = ids.length,subset;
	
	for(k=0;k<length;k+=pageSize) {
		subset = ids.slice(k,k+pageSize);
		kiva.fetchLoanDetail(subset,_didFindLoans);
	}
};

var _didFindLoans = function(response) {
	var ids;
	
	if(response.loans) {
		response.loans.forEach( function(loan) {
			
			store.updateLoanData(loan.id, loan);
		});
	}
};