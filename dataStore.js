var json = require('json');

var loanIds = [];

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
