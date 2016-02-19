var $            = require('jquery-deferred');
var log          = require('./common/log').child ({ 'sub-module' : 'redis'});
var cache        = require('../common/cache').init('proxy');
var emitter      = require('./proxy-events');
var routes_cache = require('./route-cache');

cache.redis.on('connect', function () {

	/* Read all routes from the redis cache. */

	cache.keys()
		.then(
			function (routes) {

				if (!routes.length) {
					emitter.emit ('proxy:cached-routes-added');
					add_preset_routes();
					return;
				}

				routes.forEach(function (key, index, arr) {
					cache.get (key)
					.then (
						function (_entry) {
								var entry = JSON.parse(_entry);

								log.info ({ key: key}, 'adding routes persisted from cache');
								routes_cache.add_route (key, entry.val, entry.ts);

								/*
								 * After adding the last route, emit an event so that
								 * the post action can take place */
								if (index === arr.length - 1) {
									emitter.emit ('proxy:cached-routes-added');
									add_preset_routes();
								}
							}
						);
				});
			},
			function (err) {
				log.error ({ err: err }, 'Failed to get persisted routes from redis. Might loose some pre-defined routes.');
			}
		);

});

function add_preset_routes () {
	/*
	 * Routes for the chat and log server */
	cache.get('/')
	.then(
		function () { /* Do nothing */ },
		function () {
			routes_cache.add_route ('/', "localhost:5000/", Date.now());
		}
	);

	cache.get('/socket.io')
	.then(
		function () { /* Do nothing */ },
		function () {
			routes_cache.add_route ('/socket.io', "localhost:5000/socket.io/", Date.now());
		}
	);

	cache.get('/log')
	.then(
		function () { /* Do nothing */ },
		function () {
			routes_cache.add_route ('/log', "localhost:24224/", Date.now());
		}
	);
}
