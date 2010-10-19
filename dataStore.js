var json = require('json');

var loanIds = [];
var loans = []

exports.addToIndex = function(ids) {
	var k;
	
	for(k=0;k<ids.length;k++) { loanIds.push(ids[k]); }
};

exports.getIds = function() {
	return loanIds;
};

exports.clearIndex = function() {
	loanIds = [];
};

exports.updateLoanData = function(id, loanData) {
	loans[id] = {lastUpdated: loanData, data:loanData};
};

exports.getLoanData = function(id) {
	if(loans[id]) {
		return loans[id].data;
	}
	return null;
};