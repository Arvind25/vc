define(function(require) {
	var identity  = require('identity');
	var protocol  = require('protocol');
	var urls      = require('urls');
	var log       = require('log')('cc', 'info');

	var cc = {};

	var sock;
	var host;
	var port;
	var server;
	var seq = 0;
	var _d_auth_promise;
	var _sess_config;
	var _req_channel;
	var msg_q = {};

	var ws_codes = {
		"1000" : "CLOSE_NORMAL",
		"1001" : "CLOSE_GOING_AWAY",
		"1002" : "CLOSE_PROTOCOL_ERROR",
		"1003" : "CLOSE_UNSUPPORTED",
		"1004" : "Reserved ",
		"1005" : "CLOSE_NO_STATUS",
		"1006" : "CLOSE_ABNORMAL",
		"1007" : "Unsupported Data",
		"1008" : "Policy Violation",
		"1009" : "CLOSE_TOO_LARGE",
		"1010" : "Missing Extension",
		"1011" : "Internal Error",
		"1012" : "Service Restart",
		"1013" : "Try Again Later",
		"1014" : "Reserved",
		"1015" : "TLS Handshake",
	};

	cc.init = function (framework_handle, sess_config) {

		log.info ('init : args = ', sess_config);
		var _d = $.Deferred ();
		var sess_id;

		_sess_config = sess_config;
		_req_channel = framework_handle;

		host = sess_config.session_server.host;
		port = sess_config.session_server.port;
		ssl  = sess_config.session_server.ssl;
		sess_id  = urls.sess_id ();

		/*
		 * Build the session server address */
		server  = ssl ? 'wss://' : 'ws://';
		server += host;
		server += ssl ? '' : ':' + port;
		server += '/session/' + sess_id;

		log.info ('Connecting to ' + server + ' ...');
		try {
			sock = new WebSocket (server, 'http');
		}
		catch(e) {
			_d.reject('Connection to Session Cluster failed: reason: ' + e.message);
			return _d.promise();
		}
		sock.onopen = on_open.bind(_d, sess_config);
		sock.onmessage = on_message;
		sock.onerror = on_error.bind(_d);
		sock.onclose = on_close.bind(_d);

		return _d.promise();
	};

	var authenticated = false;
	cc.auth = function (sess_config) {
		
		var from = 'user:-not-yet-authenticated-';
		var message = protocol.auth_pdu ('controller.auth', from, identity.secret);

		message.seq = seq++;

		return send (message, true);
	};

	cc.send_command = function (to, sub_resource, op, from_module) {
		var _d = $.Deferred ();
		var from = 'user:' + identity.vc_id + 'resource:' + from_module;

		var message = prot.command_pdu (to, sub_resource, op, from);
		if (!message) {
			_d.reject ('protocol parse error');
			return _d.promise ();
		}

		message.seq = ++seq;

		send (message, true)
			.then (
				_d.resolve.bind(_d),
				_d.reject.bind(_d)
			);

		return _d.promise ();
	};

	cc.send_info = function (from, to, id, data) {
		
		var message = protocol.info_pdu (from, to, id, data);

		if (!message)
			return;

		message.seq = seq++;

		return send (message, false);
	};


	/*----------------------------------------------------------------
	 * Internals
	 *----------------------------------------------------------------*/

	function send (message, ack) {
		var _d;

		if (ack) {
			/*
			 * If an ACk is required then create and store
			 * a deferred, indexed by the sequence number of
			 * the message */

			_d = $.Deferred ();
			msg_q[message.seq] = {};
			msg_q[message.seq]._d = _d;
		}

		sock.send (JSON.stringify(message));

		if (ack)
			return _d.promise ();

		return true;
	}

	function on_open (sess_config) {
		log.info ('Websocket connection to ' + server + ' 	ok');
		this.resolve (sess_config);
	}

	function on_message (e) {
		var message;

		try {
			message = protocol.parse (e.data);
		}
		catch (ex) {
			log.error ('protocol error = ', ex);
			return;
		}

		if (!authenticated) {
			/* If we are not yet authenticated then we expect the first incoming
			 * message to be an ACK to our auth request */
			var ret = handle_auth_response (message);
			if (ret) {
				message.msg.status = 'error';
				message.msg.data = ret + '.(original-data = ' + message.msg.data + ')';
				return process_ack(message);
			}

			authenticated = true;
		}
		else {
			/* Check if the message is addressed to me. Do this only for PDU
			 * after the auth has happened, because before that, we do not know
			 * our own identity */
			if (!addressed_to_me (message.to)) {
				log.error ('RX: illegal to addr (' + message.to + '): message = ', message);

				if (message.type === 'req')
					ack (message, 'error', 'not my problem');

				return;
			}
		}

		/*
		 * remove the 'user:xxx', since noone downstream needs to 
		 * know that */

		message.to = message.to.replace(/^user:[^.]+\./, '');

		switch (message.type) {
			case 'ack' : 
				process_ack (message); 
				break;
			case 'info' : 
				deliver_info (message); 
				break;
			case 'req' : 
				deliver_req (message); 
				break;
			default : 
				log.error ('RX: illegal type (' + message.type + '): message =', message);
		}

		return;
	}

	function handle_auth_response (message) {
		if (message.from !== 'controller.auth')
			return 'expected ack for auth: unexpected PDU "from" = ' + message.from;

		if (message.type !== 'ack')
			return 'expected ack for auth: unexpected PDU "type" = ' + message.type;

		return null;
	}

	function on_error (ev) {
		/*
		 * Do nothing here. React in the on_close handle
		 */
	}

	function on_close (ev) {
		if (ev.code !== 1000) {
			var reason = ws_codes[ev.code];
			reason = reason ? reason : '*unkown*';
			/* 
			 * This is an abnormal shutdown. If we are in the early stages
			 * of trying to connect then the deferred stored in the 'this'
			 * should still be pending - reject it. Else, this is somewhere
			 * in the middle of an established session.
			 */
			var _d = this;

			if (_d.state() === 'pending') {
				log.info ("on_close : code = " + ev.code + ', reason = ' + reason);
				return _d.reject ('session connect error: reason : ' + reason);
			}

			/* Here we should be raising some event or calling a framework
			 * method to inform. TODO */
		}
	}

	function addressed_to_me (to) {
		var _to = to.split('.')[0].split(':');

		if ((_to[0] === 'user') && (_to[1] == identity.vc_id))
			return true;

		return false;
	}

	function process_ack (message) {
		var seq = message.seq;
		var msg = message.msg;

		if (!msg_q[seq] || !msg_q[seq]._d) {
			log.error ('RX: ACK: seq (' + seq + ') does not exist: message = ', message);
			return;
		}

		switch (msg.status) {
			case 'ok':
				msg_q[seq]._d.resolve(msg.data);
				break;

			case 'not-ok':
			case 'error':
				msg_q[seq]._d.reject(msg.data);
				break;

			default :
				log.error ('RX: ACK: illegal status (' + msg.status + '): message = ', message);
				msg_q[seq]._d.reject(msg.data);
				break;
		}

		delete msg_q[seq];
	}

	function deliver_req (message) {

		var seq = message.seq;

		/*
		 * The _req_channel is essentially the framework. We expect
		 * it to return us a promise. TODO: Add a time out here. */

		_req_channel.rx_req (message)
			.then (
				function (data) {
					return ack (message, 'ok', data);
				},
				function (err) {
					return ack (message, 'error', err);
				}
			);
	}

	function deliver_info (message) {

		/*
		 * The _req_channel is essentially the framework. Since this
		 * is an 'info' type message, which requires no ACK, we don't
		 * expect any promise from the framework. */

		_req_channel.rx_info (message.from, message.to, message.msg.info_id, message.msg.info);
	}

	function ack (m, status, data) {
		var message = protocol.ack_pdu (message, status, data);

		message.seq = m.seq;

		sock.send (JSON.stringify(message));

		return;
	}

	return cc;
});

