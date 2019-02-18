/*jslint es6,node,white */
/*
модуль авторизации. есть три эндпоинта:
/registration
/login
/user_list
по эндпоинту регистрации можно добавлять пользователей
по логину высылаем авторизационные данные, если всё хорошо, то осуществляем авторизацию (нужно самостоятельно выбрать способ авторизации), по user_list получаем список пользователей, если авторизация выполнена
требования по стеку: express, mongadb
*/

const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer();
const cookieParser = require('cookie-parser');
const uuidv4 = require('uuid/v4');

const mongoose = require('mongoose');
//const openDb = require('./mongo.db.js');
const openDb = require('./mongoose.db.js');
const { User } = require('./mongoose.schema.js');
const openRedis = require('./redis.db.js');

const sessionTimeout = 30 * 60;




var app = express();
app.use(bodyParser.json()); // for parsing application/json
//app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use('/static', express.static(__dirname + '/public'));
app.use(cookieParser());


const routes = (db, redisClient) => {

	app.get('/', function(req, res) {
		console.log('Cookies: ', req.cookies);
		res.send(`<html>
			<body>
				hello
			</body>
		</html>`);
	});

	// по эндпоинту регистрации можно добавлять пользователей
	app.get('/registration', function(req, res) {
		res.send('use POST');
	});
	app.post('/registration', function(req, res) {
		console.log('Cookies: ', req.cookies);
		let login = req.body.login;
		let password = req.body.password;
		console.log('reg', req.body, login, password);
		let user = new User({
			login: login,
			name: login,
			password: password
		});
		(new Promise((resolve, reject) => {
			user.save((err, user) => {
				if (err) return reject(err);// console.error(err);
				resolve(user);
			});
		}))
		.then((user) => {
			// ok
			res.json(user.toJSON());
		})
		.catch(e => {
			// MongoError: E11000 duplicate key error collection:
			console.error(e);
			res.status(400).json(req.body);
		});
		//res.send('registration');
	});

	let sessionName = 'nodesession';

	let sessionId = (req) => {
		if (sessionName in req.cookies){
			return req.cookies[sessionName];
		}
		return uuidv4();
	};

	let sessionSet = (req, res) => {
		let sid = sessionId(req);
		res.cookie(sessionName, sid, {

		});
	};

	// по логину высылаем авторизационные данные, если всё хорошо, то осуществляем авторизацию (нужно самостоятельно выбрать способ авторизации)
	app.get('/login', function(req, res) {
		res.send('use POST');
	});
	app.post('/login', function(req, res) {
		sessionSet(req, res);
		let sid = sessionId(req);
		console.log('Cookies: ', req.cookies);

		(new Promise((resolve, reject) => {
			User.findOne({
				login: req.body.login,
				//password: password
			}, 'login password', (err, user) => {
				if (err) return reject(err);
				resolve(user);
			});
		}))
		.then(user => {
			// authorize? check password, throw Error
			console.log('test user', user, 'against', req.body.password);
			if (req.body.password != user.password){
				return Promise.reject('Wrong password');
			}
			console.log('OK, saving to session');

			// For debugging purposes, check if we have session already
			redisClient.get("node-session-"+sid, (err, value) => {
				if (err){
					throw new Error(err);
				}
				if (null === value){
					// no key found
					return;
				}
				// Already authenticated?
				console.log('found session in redis', sid, value);
			});

			redisClient.set("node-session-"+sid, user.login, 'EX', sessionTimeout, (err, reply) => {
				console.log('saving session in redis', sid);
			});

		})
		.catch(e => {
			console.error(e);
		});

	});


	let scanUsers = () => {

		let getLogin = (key) => {
			return new Promise((resolve, reject) => {
				redisClient.get(key, (err, value) => {
					if (err){
						return reject(err);
					}
					resolve({
						key: key,
						value: value
					});
				});
			});
		};

		let scanBatch = (users, cursor, resolve, reject) => {
			redisClient.scan(cursor, 'COUNT', '1000', function(err, reply){
				console.log('scanUsers', err, reply);
				if(err){
					throw err;
				}
				cursor = reply[0];
				let next = () => {
					if (cursor === '0'){
						console.log('scanUsers resolve ', users);
						return resolve(users);
					}else{
						return scanBatch(users, cursor);
					}
				};

				var keys = reply[1];
				let loginPromises = [];
				keys.forEach((key, i) => {
					loginPromises.push(getLogin(key));
				});

				Promise.all(loginPromises).then(sessions => {
					console.log('loginPromises ', sessions);
					sessions.forEach((session, i) => {
						users[session.key] = session.value;
					});
					next();
				}).catch(e => {
					console.error(e);
				});

			});
		};
		return new Promise((resolve, reject) => {
			var users = {};
			scanBatch(users, 0, resolve, reject);
		});
	};

	// по user_list получаем список пользователей, если авторизация выполнена
	app.get('/user_list', function(req, res) {
		console.log('Cookies: ', req.cookies)
		scanUsers().then(users => {
			console.log(users);
			res.json(users);
		}).catch(e => {
			console.error(e);
			res.status(500).json({
				error: true
			});
		});
	});
}

const appPort = 3000;

openDb.then((db) => {
	openRedis.then((redisClient) => {
		routes(db, redisClient);
		app.listen(appPort, () => {
			console.log('Server is running on ' + appPort);
			console.log('Open http://localhost:' + appPort + '/static/ for web interface');
		});
	});
}).catch(e => {
	console.error(e);
});
