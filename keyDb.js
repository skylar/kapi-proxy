// a simple mysql-backed key-db w/ timestamp

// REQUIRE
var sys = require('sys');
var sqlite = require('sqlite');

// DATA
var schema = 'CREATE TABLE IF NOT EXISTS t (k TEXT PRIMARY KEY, v TEXT, f INTEGER, ts INTEGER)';
var store_sql = 'REPLACE INTO t (k,v,f,ts) VALUES (?,?,1,?)';
var retrieve_sql = 'SELECT k,v from t WHERE k IN ';
var retrieve_one_sql = 'SELECT v from t WHERE k = ?';
var flag_save_sql = 'UPDATE t SET f=(k IN ';
var flush_sql = 'DELETE FROM t WHERE f=0 AND ts < ?';

var create_db = function() {
	var that = {},
		my = {ready: false, db: new sqlite.Database()}
	
	// make as EventEmitter
	require('tasks').emitterify(that);

	// EXPORTS
	that.init = function(filename) {
		// open the DB and insert schema (if necessary)
		my.db.open(filename, function (error) {
		  if (error) {
		      throw error;
			} else {
				my.db.executeScript(schema, function(error, rows) {
					if(error) throw error;
					my.ready = true;
					that.emit('ready');		
				});
			}
		});
	}

	that.store = function(id, data) {
		if('object' === typeof(data)) { data = require('json').stringify(data); }
		my.db.execute(store_sql, [id,data,Date.now()], function(error,rows) {
			if(error) { throw error; }
		});
	},

	that.retrieve = function(ids, callback) {
		var data = [];
		my.db.execute(retrieve_sql + my._arrayBinding(ids.length), ids, function(error,rows) {
			if(error) { throw error; }
			if(rows.length) { callback(rows); }
			else {callback(data);}
		});
	},

	that.retrieveOne = function(id, callback) {
		var data = null;
		my.db.execute(retrieve_one_sql, [id], function(error,rows) {
			if(error) { throw error; }
			if(rows.length === 1) { data = rows[0]['v']; }

			callback(data);
		});
	},

	that.flagForSave = function(ids) {
		my.db.execute(flag_save_sql + my._arrayBinding(ids.length) + ')', ids, function(error) { if(error) throw error;} );
	},

	that.flush = function(ageInSeconds) {
		var then = Date.now() - (ageInSeconds*1000);
		my.db.execute(flush_sql, [then], function(error, rows) { if(error) throw error;} );
	}
	
	my._arrayBinding = function(k) {
		var n, sql = '(';
		
		for(n=0;n<k-1;n++) { sql += '?,'; }
		return sql + '?)';
	}
	return that;
}
exports.db = create_db;
