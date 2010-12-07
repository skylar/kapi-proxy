var db = require('./keyDb').db();
var dispatch = require('tasks');

var tq = dispatch.serialQueue();

db.on('ready', function() {
	db.store('abc', 'cow'); //t.done();
	db.store('def', 'dog'); //t.done();
	db.store('abc', 'Wow, this is "magically" delicious.'); //t.done();
	db.flagForSave(['abc','efg']); //t.done();
	db.flush(-2);
});
db.init('test.db');

setTimeout(function() { 
	db.retrieveOne('abc',function(data) {
		if(data) {
			console.log("FOUND abc: " + data);
		} else {
			console.log("DID NOT FIND.");
		}
	});
	db.retrieveOne('def',function(data) {
		if(data) {
			console.log("FOUND def: " + data);
		} else {
			console.log("DID NOT FIND.");
		}
	});
	db.retrieve(['abc','234'],function(data) {
		if(data.length) {
			console.log("FOUND abc: " + data[0].v);
		} else {
			console.log("DID NOT FIND.");
		}
	});
}, 2000);
