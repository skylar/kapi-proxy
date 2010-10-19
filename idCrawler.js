// REQUIRES
var kiva = require('./kivaClient');
var store = require('./dataStore');

// MAIN
var maxConnections = 5;
var currentPage = 0;
var lastPage,connectionCount,completionCallback,progressCallback,idCache = [];

var stripObjectsToIds = function(objects) {
	var k;
	var ids = [];
	
	for(k=0;k<objects.length;k++) {
		ids.push(objects[k].id);
	}
	return ids;
};

var updateStoreFromCache = function() {
	var k;
	
	store.clearIndex();
	for(k=0;k<idCache.length;k++) {
		store.addToIndex(idCache[k]);
	}
	idCache = [];
	currentPage = 0;

	completionCallback();
};

var onDataReturn = function(response) {
	var fetchedPage = response.paging.page, ids;
	
	connectionCount--;
	idCache[fetchedPage-1] = ids = stripObjectsToIds(response.loans);

	lastPage = response.paging.pages;
	progressCallback(ids);
		
	if(currentPage < lastPage) { getMorePages();}
	else if(connectionCount < 1) { updateStoreFromCache(); }
};

var getMorePages = function() {
	while(connectionCount < maxConnections) {
		currentPage++;
		kiva.fetchPage(currentPage, onDataReturn);
		connectionCount++;
	}
};

exports.updateIdIndex = function(callback,progCallback) {
	// we can't update if we're in the middle of an update
	if(currentPage) return false;
	
	// otherwise, reset the state machine
	currentPage = 0;
	lastPage = 1000;
	connectionCount = 0;
	idCache = [];
	getMorePages();
	completionCallback = callback;
	progressCallback = progCallback;
	
	return true;
};
