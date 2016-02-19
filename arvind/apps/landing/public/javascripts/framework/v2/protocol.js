define(function(require) {
	var log = require('log')('protocol', 'info');

	var prot = {};

	prot.parse = function (e) {

		var message = JSON.parse(e); 

		if (message.v !== 1)
			throw new Error ('illegal protocol v');

		if (!message.to || !message.from)
			throw new Error ('illegal protocol (from/to) address');

		if ((message.type != 'auth') &&
			(message.type != 'req') &&
			(message.type != 'info') &&
			(message.type != 'ack'))
			throw new Error ('illegal protocol message type');

		return message;
	};

	prot.command_pdu = function (to, sub_resource, op, from) {
		var m = {};

		if (!to || !sub_resource || !op || !from) {
			log.error ('command_pdu: null argument(s): ' +
					   		'to = ' + to +
					   		', sub_resource = ' + sub_resource +
					   		', op = ' + op +
					   		', from = ' + from
					  );

			return null;
		}

		m.v     = '1';
		m.type  = 'req';

		m.to    = to;
		m.from  = from;

		m.msg  = {
			target : sub_resource,
			op     : op
		};

		return m;
	};

	prot.info_pdu = function (from, to, info_id, data) {
		var m = {};

		if (!from || !to || !info_id || !data) {
			log.error ('command_pdu: null argument(s): ' +
					   		'from = ' + from +
					   		', to = ' + to +
					   		', info_id = ' + info_id +
					   		', data = ' + data
					  );

			return null;
		}

		m.v     = 1;
		m.type  = 'info';

		m.to    = to;
		m.from  = from;

		m.msg  = {
			info_id : info_id,
			info    : data
		};

		return m;
	};

	prot.auth_pdu = function (to, from, data) {
		var m = {};

		m.v = 1;
		m.type = 'req';
		m.to = to;
		m.from = from;
		m.msg = data;

		return m;
	};

	prot.ack_pdu = function (message, status, data) {
		var m = {};

		m.v = 1;
		m.type = 'ack';
		m.to   = message.from;
		m.from = message.to;
		m.msg  = {
			status : status,
			data   : data
		};

	};

	return prot;
});
