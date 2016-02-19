var redis   = require('../common/cache').init('proxy');
var log     = require('./common/log').child ({ 'sub-module' : 'routes-cache'});
var host    = require('./common/args').host;
var proxy   = require('./proxy');
var emitter = require('./proxy-events');

/*
 * Used to update list of routes whenever proxy registers or unregisters */

var m     = {};
var cache = {};

emitter.on('proxy:cached-routes-added', commit_routes_to_redis);

m.add_route = function (key, val, ts) {

	/*
	 * If the key already exists, we prefer to keep whichever
	 * is more recent */
	if (cache[key]) {

		if (cache[key].ts > ts)
			return;

		/* Apparently we have an older entry in our cache. Delete it */
		log.info ({
				key       : key,
				old_value : cache[key].val,
				old_ts    : cache[key].ts,
				new_value : val,
				ts        : ts
			}, 'overwriting older route'
		);

		proxy.unregister (host + key);
	}

	cache[key] = { 
		val : val,
		ts  : ts,
		persist : false
	};

	/*
	 * If we are able to write this set successfully to REDIS, we mark
	 * the persist as true. This can be later used in REDIS disconnect
	 * and reconnect scenarios */
	if (redis.set(key, JSON.stringify (cache[key])))
		cache[key].persist = true;

	proxy.register (host + key , val);
};

m.remove_route = function (key) {
	if (cache[key]) {
		delete cache[key];
		redis.invalidate (key);
		proxy.unregister (host + key);
	}
};

m.get_all = function () {
	return cache;
};

m.get = function (key) {
	if (cache[key])
		return cache[key].val;

	return null;
};

m.exists = function (key) {
	return cache[key] ? true : false;
};

m.matches = function (key, value) {
	if (!cache[key])
		return false;

	return cache[key].val == value ? true : false;
};

function commit_routes_to_redis () {
	for (var key in cache) {
		if (cache[key].persist)
			continue;

		if (redis.set(key, JSON.stringify(cache[key]))) {
			cache[key].persist = true;
			log.info ({ key: key, val: cache[key].val, ts: cache[key].ts }, 'commiting to redis');
		}
	}
}

module.exports = m;
