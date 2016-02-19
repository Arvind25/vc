define(function(require) {
	var log = require('log')('urls', 'info');

	var location = window.location;
	var query_str = location.search.replace(/^\?/g, '');
	var query_params = {};
	var session_id;
	var base_url = location.pathname;
	var port = location.port;

	var urls = {};

	function init() {
		location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(str,key,value) {
			if (!query_params[key])
				query_params[key] = [];
			query_params[key].push(value);
		});

		/* Store the session id */
		session_id  = location.pathname.replace (/^.*\/session\/v1\//, '').replace (/^([^/]+).*/, "$1");
		log.log ('session id - ' + session_id);
	}

	function add_query (q) {
		if (!q)
			return '';
		return '?' + q;
	}

	init();

	urls.sess_id = function (){
		return session_id;
	};
	urls.params = function (key){
		if (query_params[key])
			return query_params[key][0];
		return null;
	};

	urls.params_array = function(key){
		return query_params[key];
	};

	function make (url) {
		return base_url + '/' + url;
	}

	urls.query_str = query_str.replace(/^[?]*/, '');

	urls.session = {};
	urls.session.join  = make ('join' + add_query(query_str));
	urls.session.load  = make ('load' + add_query(query_str));
	urls.query_params  = query_params;

	return urls;
});
