var url             = require('url');
var __log           = require("./common/log");
var log             = require("./common/log").sub_module('connection');
var events          = require('./events')('connection');
var cc              = require('./cc');

var sock_id = 1;
var list = {};

function set_user (vc_id) {
	var conn_id = this.c.id;

	if (!list[conn_id]) {
		log.error ({conn_id : conn_id}, 'unknown');
		return false;
	}

	this.c.vc_id = vc_id;
	return true;
}

function close () {
	log.info ({conn_id : this.c.id}, 'connection: closed: removing connection');
	events.emit ('closed', this.c.vc_id);
	delete list[this.c.id];
}

function show_conn (c, comment) {
	if (!c)
		c = this.c;

	if (comment)
		comment = ' (' + comment +') ';

	log.debug (comment + '# ' + c.id + '/' + (c.state ? c.state : '-') + ' ' + c.addr + ':' + c.port + ' (user: ' + (c.vc_id ? c.vc_id : '-') + ')');
}

function send_info (from, to, info_id, info) {
	cc.send_info (this.c.sock, from, to, info_id, info);
}

var connection = {};

var msg_route;
connection.init = function () {
	/*
	 * A hack to resolve the circular dependencies. TODO: clean
	 * this up. */
	msg_route = require ('./msg-route');
};

connection.route_req = function (sock, from, to, msg) {
	return msg_route.route_req (sock.conn_handle, from, to, msg);
};

connection.route_info = function (sock, from, to, msg) {
	/*
	 * A hack to resolve the circular dependencies. TODO: clean
	 * this up. */
	return msg_route.route_info (sock.conn_handle, from, to, msg);
};

connection.events = events;
connection.close  = function (sock) {
	var conn_handle = sock.conn_handle;
	conn_handle.close ();
};

connection.new_connection = function (sock) {

	var location = url.parse (sock.upgradeReq.url, true);
	var c = {
		id       : sock_id,
		sock     : sock,
		location : location.path,
		addr     : sock.upgradeReq.connection.remoteAddress,
		port     : sock.upgradeReq.connection.remotePort,
		state    : 'connected',
		log      : __log.child({ 'conn #' : sock_id })
	};

	sock_id ++;

	show_conn(c, 'new');

	if (list[c.id])
		log.error ({conn_id : c.id}, 'new: possibly over-writing connection info');

	list[c.id] = c;

	var handle =  {
		c         : c,
		send_info : send_info,
		show_conn : show_conn,
		set_user  : set_user,
		log_handle : function () { return this.c.log; },
		close     : close
	};

	sock.conn_handle = handle;

	return handle;
};

module.exports = connection;
