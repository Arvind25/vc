define(function(require) {
	var log = require('log')('event', 'log');

	var map = {};

	function __entry () {
		return {
			emitters : {},
			listeners : {}
		};
	}

	_event = {};
	_event.emitter = function (name_space, binder) {
		if (!binder) {
			log.error ('emitter: error: null binder for name_space:' + name_space);
			return null;
		}

		if (!map[name_space])
				map[name_space] = new __entry ();

		if (map[name_space].emitters[binder]) {
			log.error ('emitter: error: name_space:' + name_space + ' + binder:' + binder + ' already exist');
			return null;
		}

		log.log ('EMITTER ( ' + name_space + ' ) for ' + binder);
		map[name_space].emitters[binder] = true;

		var e = {
			name_space : name_space,
			binder     : binder,
			emit       : emit
		};

		return e;
	};

	_event.bind = function (name_space, handler, binder) {
		if (!binder) {
			log.error ('bind: error: null binder for name_space:' + name_space);
			return false;
		}

		if (!map[name_space])
				map[name_space] = new __entry ();

		if (map[name_space].listeners[binder]) {
			log.error ('bind: error: name_space:' + name_space + ' + binder:' + binder + ' already exist');
			return false;
		}

		log.log ('BIND ( ' + name_space + ' ) for ' + binder);
		map[name_space].listeners[binder] = {
			handler : handler,
			binder  : binder
		};

		return true;
	};

	_event.unbind = function (name_space, binder) {
		if (!map[name_space]) {
			log.error ('unbind: error: name_space:' + name_space + ' does not exist');
			return false;
		}

		if (!map[name_space].listeners[binder]) {
			log.error ('unbind: error: name_space:' + name_space + ' + binder:' + binder + ' does not exist');
			return false;
		}

		log.log ('UNBIND ( ' + name_space + ' ) for ' + binder);
		delete map[name_space].listeners[binder];
		return true;
	};

	function emit (ev, data) {
		var name_space = this.name_space;
		var listeners = map[name_space].listeners;

		log.log ('EMIT ( ' + name_space + ' _ ' + ev + ' ), data =', data);

		for (var key in listeners) {
			trigger_event (listeners[key], name_space, ev, data);
		}
	}

	function trigger_event (listener, name_space, ev, data) {
		var handler = listener.handler;

		setTimeout(function() {
			log.log ('TRIG ( ' + name_space + ' _ ' + ev + ' ) for ' + listener.binder);
			handler (ev, data);
		});
	}

	return _event;

});
