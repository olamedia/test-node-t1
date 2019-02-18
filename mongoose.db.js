const mongoose = require('mongoose');
const assert = require('assert');

const dbConfig = require('./mongo.config.js');
const dbUrl = dbConfig.constructUrl({
	//dbName: 'tests'
});

const openDb = new Promise((resolve, reject) => {
	mongoose.connect(dbUrl, {
		useNewUrlParser: true,
		dbName: 'tests'
	});
	var db = mongoose.connection;
	db.on('error', () => {
		reject('Connection error using ' + dbUrl);
	});
	db.once('open', function() {
		resolve(db);
	});
});

module.exports = openDb;
