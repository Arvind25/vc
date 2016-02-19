var WebSocketServer = require('ws').Server;
var $               = require("jquery-deferred");
var log             = require("./common/log").sub_module('msg-route');
var config          = require("./config");
var addr            = require("./addr");
var controller      = require("./controller");
var resources       = require("./resources");

route = {};
route.route_req = function (conn, from, to, msg) {

	var _d = $.Deferred ();
	/*
	 * format of addresses (from/to):
	 * 		resourceA[:instanceA][resourceB[:instanceB]] ... */

	var _to = addr.inspect_top (to);

	switch (_to.resource) {
		case 'user' :
			_d.reject ('not implemented', 'msg-route');
			return;

		case 'controller' :

			controller.process (conn, from, addr.pop(to), msg)
				.then (
					_d.resolve.bind(_d),
					_d.reject.bind(_d)
				);
			break;

		default:
			_d.reject ('bad address', 'msg-route');
			return;
	}

	return _d.promise ();
};

route.route_info = function (conn, from, to, msg) {
	/*
	 * format of addresses (from/to):
	 * 		resourceA[:instanceA][resourceB[:instanceB]] ... */

	var _to = addr.inspect_top (to);

	switch (_to.resource) {
		case 'user' :
			log.error ('route.route_info: NOT IMPLEMENTED for \"user\"');
			return;

		case 'controller' :
			log.error ('route.route_info: NOT IMPLEMENTED for \"controller\"');
			return;

		default:
			resources.route_info (from, to, msg);
			return;
	}

};

module.exports = route;
