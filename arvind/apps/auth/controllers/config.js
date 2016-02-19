var model = require( 'auth/models/db' );
var cache = require( 'auth/social_auth/cache' );

controller = {};

/* get all credentials from db */
controller.get_all = function (req, res, next) {
	model.get_all ()
		.then (
			function (result) {
				res.status(200).send(result);
			},
			function (err) {
				res.status(500).send(err);
			}
		);
};

/* add credentials to mongodb as well as cache */
controller.add = function (req, res, next) {
	var credentials = req.body;

	model.add (credentials)
		.then (
			function (result) {
				/*
				 * add credentials to cache as well*/
				cache.add(credentials);
				res.status(200).send(result);
			},
			function (err) {
				res.status(500).send(err);
			}
		);
};

/* remove credentials from mongodb as well as cache */ 
controller.remove = function (req, res, next) {
	var credentials = req.body;

	model.remove (credentials)
		.then (
			function (result) {
				/*
				 *remove credentials from cache as well*/
				cache.invalidate(credentials);
				res.status(200).send(result);
			},
			function (err) {
				res.status(500).send(err);
			}
		);
};

module.exports = controller;

