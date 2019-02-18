const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const dbConfig = require('./mongo.config.js');
const dbUrl = dbConfig.constructUrl();

const dbName = 'tests';

// Create a new MongoClient
const client = new MongoClient(dbUrl, {
	useNewUrlParser: true
});

const openDb = new Promise((resolve, reject) => {
	client.connect(function(err) {
		reject(err);
		console.log("Connected successfully to mongo server");
		const db = client.db(dbName);
		resolve(db);
		// client.close();
	});
});

module.exports = openDb;
