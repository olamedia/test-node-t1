
const redis = require("redis");
// const {promisify} = require('util');



const dbOpen = new Promise((resolve, reject) => {
	var client = redis.createClient();
	// client.select(0);
	client.on("error", function (err) {
	    reject("Error " + err);
	});
	client.on("ready", function (err) {
	    resolve(client);
	});
});


module.exports = dbOpen;
