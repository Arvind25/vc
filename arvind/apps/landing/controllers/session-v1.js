var $         = require('jquery-deferred');
var cache     = require('common/cache').init('vc-sess-config', 4*60*60*1000);
var path      = require('path');
var async     = require('async');
var backend   = require('landing/controllers/backend-if');
var provision = require('landing/controllers/provision-server');
var log       = require('landing/common/log');
var templates = require('landing/controllers/templates');

controller = {};
controller.load_and_cache_config = function (req, res, next) {

	var session_id = req.params.session_id;

	cache.get(session_id)
		.then(
			function (sess_config) {

				/* Cache hit */

				if (!req.wiziq)
					req.wiziq = {};

				req.wiziq.sess_config = JSON.parse(sess_config);
				return next();
			},

			function () {

				/* Cache miss */

				backend.get_config (session_id, function (err, sess_config) {

					if (err)
						return next(err, req, res);

					cache.set(session_id, JSON.stringify(sess_config));

					if (!req.wiziq)
						req.wiziq = {};

					req.wiziq.sess_config = sess_config;
					return next();
				});
			}
		);
};

controller.load_page = function (req, res, next) {

	var session_id = req.params.session_id;

	/*---------------------------------------
	 *
	 * Things to do:
	 * 		- load the session configuration
	 * 		  from the core backend (already done 
	 * 		  in 'load_and_cache_...'
	 *
	 * 		- load the templates
	 * 			+ render the page
	 *
	 * 		- connect to provision server
	 * 			+ get the session instance information
	 *
	 *--------------------------------------*/

	sess_config = req.wiziq.sess_config;
	var css = [];

	if (!sess_config)
		return next(new Error('null sess_config for session "' + session_id + '"'), req, res);

	var _templates = templates.load (req.log, __dirname + '/../views/framework/templates', sess_config);

	/*
	 * Get a list of all CSS files to be loaded */
	for (var r = 0; r < sess_config.resources.length; r++ ) {
		if (sess_config.resources[r].display_spec.css) {
			css.push ({
				resource: sess_config.resources[r].name,
				css:      sess_config.resources[r].display_spec.css
			});
		}
	}

	res.render ('framework/' + sess_config.structure + '/vc-frame', { 
		layout     : sess_config.layout,
		theme      : sess_config.theme,
		_templates : JSON.stringify(_templates),
		identity   : req.wiziq.user,
		styles     : css
	});
};

controller.load_config = function (req, res, next) {
	return res.status(200).send(req.wiziq.sess_config);
};

module.exports = controller;
