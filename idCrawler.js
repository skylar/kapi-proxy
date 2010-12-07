// REQUIRES
var kiva = require('./kivaClient');
var store = require('./dataStore');
var tasks = require('tasks');

// DATA
var queue = tasks.queue("kc",5);
var busy = false;
var completionCallback,lastPage,progressCallback,idCache = [];

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
	
	if(!busy) return;
	store.clearIndex();
	for(k=0;k<idCache.length;k++) {
		store.addToIndex(idCache[k]);
	}
	idCache = [];
	busy = false;

	completionCallback();
};

var onDataReturn = function(response) {
	var fetchedPage = response.paging.page, ids;
	console.log("Got page " + fetchedPage);
	
	idCache[fetchedPage-1] = ids = stripObjectsToIds(response.loans);

	lastPage = response.paging.pages;
	progressCallback(ids);
};

var pageFetcher = function(k) {
	return function(task) {
		kiva.fetchPage(k, function(r) {onDataReturn(r); task.done();} );
	}
};

var getTheOtherPages = function() {
	for(k=2;k<=lastPage;k++) {
		queue.push(pageFetcher(k));
	}
}

exports.updateIdIndex = function(callback,progCallback) {
	// we can't update if we're in the middle of an update
	if(busy) return false;
	
	// otherwise, reset the state machine
	busy = true;
	idCache = [];
	completionCallback = callback;
	progressCallback = progCallback;
	lastPage = 1;
	queue = tasks.queue("kc",5); // new queue to avoid confusion
	
	firstPage = tasks.task(pageFetcher(1));
	firstPage.on('completed',getTheOtherPages);
	queue.push(firstPage);
	queue.on('completed',updateStoreFromCache);
	
	return true;
};
