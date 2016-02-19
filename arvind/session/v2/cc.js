var WebSocketServer = require('ws').Server;
var $               = require("jquery-deferred");
var log             = require("./common/log").sub_module(cc);
var config          = require("./config");
var protocol        = require("./protocol");

var wss;

var cc = {};
var upstream;
var seq = 1;

cc.init = function (server, route, sess_config) {

	upstream = route;
	/*
	 * Init the server socket. Only one for now. */
	var wss = new WebSocketServer({ 
		server: server,
		verifyClient : verify
	});

	wss.on('connection', function (ws) {

		log.debug ({ headers : ws.upgradeReq.headers }, 'incoming connection');

		/* Add connection to list */
		upstream.new_connection (ws);

		ws.on ('message', function (message) {
			handle_incoming (ws, message);
		});

		ws.on ('error', function (err) {
			log.error ({ err : err }, 'connection error');
		});

		ws.on ('close', function (err) {
			upstream.close (ws);
		});
	});
};

cc.send_info = function (sock, from, to, info_id, info) {
	var m = protocol.info_pdu (from, to, info_id, info);
	if (!m)
		return;

	m.seq = seq++;
	sock.send (JSON.stringify(m), function (err) {
		if (err)
			log.error ({ err:err, to:to, info_id:info_id }, 'socket send error');
	});
	protocol.print(m);
};

function verify (info, callback) {
	callback (true, 0, null);
}

function handle_incoming (ws, message) {
	try {
		m = protocol.parse (message);
	}
	catch (e) {
		log.error ( { msg:message, err: e.message }, 'protocol parse error');
		return;
	}

	protocol.print(m);

	switch (m.type) {

		case 'req':
			upstream.route_req (ws, m.from, m.to, m.msg)
				.then (
					function (data) {
						ack (ws, m, data);
					},
					function (data) {
						nack (ws, m, data);
					}
				);

			break;

		case 'info':
			upstream.route_info (ws, m.from, m.to, m.msg);
			break;
	}
}

function ack (sock, _m, data) {
	return __ack (sock, _m, 'ok', data /* 'from' implicit from the original message */);
}

function nack (sock, _m, data) {
	return __ack (sock, _m, 'not-ok', data /* 'from' implicit from the original message */);
}

function __ack (sock, _m, status, data, from) {
	var m = protocol.ack_pdu (_m, status, data, from);

	m.seq = _m.seq;
	sock.send(JSON.stringify(m));

	protocol.print(m);
}

module.exports = cc;
