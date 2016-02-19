var log             = require('./log').child ({ 'sub-module' : 'api'});
var routes_cache    = require('./route-cache');
var proxy_api       = {};

proxy_api.register = function (req, res, next) {
	var key   = req.body.key;
	var value = req.body.value;

	if (!key || !value) {
		log.warn ({ key:key, value:value }, 'register: null parameters');
		return res.status(400).sened('invalid or null data');
	}

	if (routes_cache.exists (key))
		routes_cache.remove_route (key);

	routes_cache.add_route (key, value);
	res.status(200).send('route registered');
	log.info ( { key: key, value : value }, 'registered route');

	return;
};


proxy_api.unregister = function (req, res, next) {
	var key = req.body.key;

	log.info ( { key: key }, 'unregister route');

	if (!key) {
		log.warn ({ key:key }, 'unregister: null parameters');
		return res.status(400).sened('invalid or null data');
	}

	if (!routes_cache.exists (key)) {
		log.warn ({ key:key }, 'unregister: no such route');
		return res.status(404).send('no such route');
	}

	routes_cache.remove_route (key);
	res.status(200).send('route unregistered');
	log.info ( { key: key }, 'unregistered route');

	return;
};

proxy_api.list = function (req, res, next) {
	res.status(200).send( routes_cache.get_all() );
};

/*
 * Routes for the landing page */
routes_cache.add_route ('/landing', "localhost:2178/landing/");
routes_cache.add_route ('/auth', "localhost:2178/auth/");

/*
 * Routes for the chat and log server */
routes_cache.add_route ('/', "localhost:5000/");
routes_cache.add_route ('/socket.io', "localhost:5000/socket.io/");
routes_cache.add_route ('/log', "localhost:24224/");

module.exports = proxy_api;
