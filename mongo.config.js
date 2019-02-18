

const dbConfig = {
	user: 'root',
	pass: 'example'
};

const constructUrl = (options) => {
	const user = encodeURIComponent(dbConfig.user);
	const password = encodeURIComponent(dbConfig.pass);
	const authMechanism = 'DEFAULT';
	const dbName = 'dbName' in options?options.dbName:'';
	return `mongodb://${user}:${password}@localhost:27017/${dbName}?authMechanism=${authMechanism}`;
}

module.exports = {
	...dbConfig,
	constructUrl
};
