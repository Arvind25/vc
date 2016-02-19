var log = require("./common/log").sub_module('protocol');
var config = require("./config");

var prot = {};

prot.parse = function (e) {

	var message = JSON.parse(e); 

	if (message.v !== 1)
		throw new Error ('illegal protocol');

	if ((message.type != 'req') && (message.type != 'info'))
		throw new Error ('illegal type');

	return message;
};

prot.command_pdu = function (to_user, module, from_user, target, op) {
	var m = {};

	if (!to_user || !from_user || !target || !op) {
		log.error ({
			to: (to_user ? to_user : 'null'),
			from: (from_user ? from_user : 'null'),
			target: (target ? target : 'null'),
			op: (op ? op : 'null')}, 'command_pdu: null argument(s)');
		return null;
	}

	m.v     = '1';
	m.type  = 'req';

	/*
	 * "to" is of the form:
	 * 		{
	 * 			ep:	{
	 * 					t : type ==> 'user' | 'server'
	 * 					i : identifier (NA in case of 'server' and is an array:
	 * 							- [ name1, name2 .. ]
	 * 							- [ * ]
	 * 				}
	 * 			res : resource-name
	 * 		}
	 */

	m.to     = {};
	m.to.ep  = { t : 'user', i : [] };
	m.to.res = module;

	if (to_user instanceof Array)
		for (i = 0; i < to_user.length; i++)
	m.to.ep.i.push(to_user[i]);
	else
		m.to.ep.i.push(to_user);

	m.from = {
		ep : {
			t : 'user',
			i : from_user
		},
		res : module
	};

	m.msg  = {
		target : target,
		op     : op
	};

	return m;
};

prot.info_pdu = function (from, to, info_id, info) {
	var m = {};

	if (!to || !from || !info_id || !info) {
		log.error ({
			to: (to ? to : 'null'),
			from: (from ? from : 'null'),
			info_id: (info_id ? info_id : 'null'),
			info: (info ? info : 'null'),
		},'protocol.info_pdu: null arguments(s)');
		return null;
	}

	m.v     = 1;
	m.type  = 'info';
	m.to    = to;
	m.from  = from;
	m.msg  = {
		info_id : info_id,
		info    : info
	};

	return m;
};

prot.auth_pdu = function (from_user) {
	var m = {};

	m.v = 1;
	m.type = 'req';
	m.to = {};
	m.to.ep = { t : 'server' };
	m.to.res = 'auth';

	m.from = {
		ep : {
			t : 'user',
			i : from_user
		},
		res : 'framework'
	};

	m.msg = {};

	return m;
};

prot.ack_pdu = function (message, status, data, from) {
	var m = {};

	m.v = 1;
	m.type = 'ack';
	m.to   = message.from;
	m.from = (from ? from : message.to);
	m.msg  = {
		status : status,
		data   : data
	};

	return m;
};

prot.print = function (m) {
	if (m.type === 'info')
		log.debug ('PDU: v' + m.v + ' ' + m.type + '.' + m.seq + ' \"' + m.msg.info_id + '\"' + ' (' + m.from + ' -> ' + m.to + ')');
	else if (m.type === 'ack')
		log.debug ('PDU: v' + m.v + ' ' + m.type + '.' + m.seq + ' \"' + m.msg.status + '\"' + ' (' + m.from + ' -> ' + m.to + ')');
	else
		log.debug ('PDU: v' + m.v + ' ' + m.type + '.' + m.seq + ' (' + m.from + ' -> ' + m.to + ')');
	/*
	log.debug ('     ' + JSON.stringify(m.msg));
	*/
};

prot.make_addr = function (user, resource, instance) {
	if (!user) {
		log.error ('protocol.make_addr: null user');
		return null;
	}

	var _u = 'user:' + user;
	var _r = '';
	var _i = '';

	if (resource)
		_r = '.' + resource;

	if (instance)
		_i = ':' + instance;

	return _u + _r + _i;
};

prot.get_user_from_addr = function (addr) {
	/* Addresses should be of the form
	 * 		- 'user.<user-name>[.resource.<res-name>][.instance.<instance>] */

	var s = addr.split(':');
	if (s[0] != 'user')
		return null;

	return s[1];
};

module.exports = prot;
