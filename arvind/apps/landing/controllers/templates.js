var path      = require('path');
var fs        = require('fs');
var jade      = require('jade');
var _E        = require('landing/common/custom-error');

templates = {};

templates.load = function (log, dir, config) {

	return template_list (log, dir, config);
};

function template_list (log, dir, config) {
	var _templates = {};

	for (var i = 0; i < config.resources.length; i++) {
		var _r = config.resources[i];
		var _rname = _r.name;

		_templates[_rname] = {};
		for (var t = 0; t < _r.display_spec.templates.length; t++) {
			var tname = _r.display_spec.templates[t];
			try {
				_templates[_rname][tname] = function_body (log, dir + '/' + _rname, tname);
			}
			catch (e) {
				log.error ('controller.templates: load failed for ' + _rname + '->' + tname + ', err = ' + e);
			}
		}
	}

	return _templates;
}

/*
 * Jade compilation produces a function string of the following form:
 *
 * 	--> "function name(locals) { <body> }".
 *
 * We want to change it to the following form:
 *
 * --> "template.name = function(locals) { <body> }"
 *
 */
function function_body (log, dir, file) {

	log.info ('loading template ' + dir + '/' + file + '.jade');

	var _func = jade.compileFileClient(path.join(dir, file + '.jade'), { name: file });
	_func = _func.replace(/function[ ]+([^() ]+)[ ]*\(/g, 'function (');

	return _func;
}

module.exports = templates;
