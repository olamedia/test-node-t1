const mongoose = require('mongoose');
var userSchema = new mongoose.Schema({
	login: {
		type: String,
		unique: true
	},
	password: String,
	name: String
});
var User = mongoose.model('User', userSchema);

var waitForIndex = (resolve, reject) => {
	User.on('index', function(err) {
		if (err){
			return reject(err);
		}
		resolve();
	});
};

module.exports = {
	User
};
