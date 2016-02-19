var EventEmitter    = require('events').EventEmitter;
var log             = require("./common/log").sub_module('event');
var emitter = new EventEmitter();

var events = {};
function emit (prefix, e, data) {
	log.debug ({ e : prefix + '.' + e}, 'emit');
	emitter.emit (prefix + '.' + e, data);
}

function on (prefix, e, callback) {
	emitter.on (prefix + '.' + e, function (data) {
		log.debug ({ e : prefix + '.' + e, data : (data ? data : 'none')}, 'trigger');
		callback (data);
	});
}

function ev (name) {
	var prefix = name;

	return {
		emit : emit.bind(this, prefix),
		on   : on.bind(this, prefix),
	};
}

module.exports = ev;
