var async     = require('async');
var config    = require('landing/config');
var log       = require('landing/common/log');
var args      = require('common/args');
var templates = require('landing/controllers/templates');


/*
 * This is a interface to the actual backend. Going forward
 * the backend may reside on a different location and the
 * communication to it will be be controlled by this module.
 *
 * For now, we code the backend right here.
 *
 */

controller = {};
controller.get_config = function (sess_id, callback) {
	/*---------------------------------------
	 *
	 * Things to do:
	 *
	 * 		- If the session config is in the cache
	 * 		  then return it
	 *
	 * 		- else load the session configuration
	 * 		  from the core backend
	 *
	 * 		- Cache it
	 *
	 *--------------------------------------*/

	return get_config_meghadoot (sess_id, callback);
};

function get_config_meghadoot (sess_id, callback) {

	var av_config = {
		maxvideo : 6,
		conftype :  'audiovideo',
		publish : true,
		videores : 'qvga',
		hdvideo : false,
		stats : false,
		maxvideores : 'vga',
		videolayout : 'horizontal'
	};

	var user_config = {
		name : null,
		id : null,
		role : 'moderator'
	};

	var ot = {
		name    : 'ot',
		enabled : true,
		port : 8080,
		host : '192.168.56.101'
	};

	var session_config = {
		structure: 'classic-1',
		layout   : 'classic-1',
		theme    : 'sujits-vision',
		auth     : {
			via : [ 'google', 'anon' ]
		},
		session_server : {
			/*
			 * If a debug argument is provided, use it. Else default to localhost */
			host : args.session_server_ip () ? args.session_server_ip () : 'localhost',
			port : args.session_server_port () ? args.session_server_port () : 3179,
			ssl  : args.session_server_ssl () ? true: false,
			auth : {}
		},
		resources : [
			{
				name: 'menu-sidepush-classic',
				role: 'menu',
				req_sess_info : false,
				display_spec: { widget: "nav", templates: [ 'demo' ], css: [ 'jquery.mmenu.all' ] },
				perms: { },
				custom: {
					sub_menu_vslide: true,
					hlight_sel: true,
				},
			},
			{
				name: 'cube',
				role: 'whitelabeling',
				req_sess_info : false,
				display_spec: { widget: "none", templates: [ 'cube' ], css: [ 'cube2' ] },
				/*
				 * perms must be returned per user */
				perms: { },
				custom: {
					small : {
					},
					center : {
					}
				},
			},
			{
				name: 'av-tokbox-v2',
				role: 'av',
				display_spec: { widget: 'av', templates: [ 'av-tokbox' ], css: [ 'classic-1.min' ] },
				/*
				 * perms must be returned per user */
				perms: { },
				custom: {
					random_string : 'welcome',
					config : av_config,
					user : user_config,
					server : ot,
					screenshare : true,
					debug_controls : false,
					chromeextensionid : "cofnnopnhjmpoomoholnofbneelimjdm",
				},
			},
			{
				name: 'flipboard-v1',
				req_sess_info : false,
				display_spec: { widget: "tabs", templates: [ "v1","content-player" ], css: [ 'bookblock', 'flipboard' ] },
				/*
				 * perms must be returned per user */
				perms: { },
				custom: {
				},
			},
			{
				name: 'chat-box',
				display_spec: { widget: 'chat', templates: [ "chat-v1","message" ], css: [ 'chat-box.min']  },
				custom: {
				},
			},
			{
				name: 'att-list',
				req_sess_info : false,
				display_spec: { widget: 'attendees', templates: [ "main", "user"], css: [ 'main.min'] },
				custom: {
				},
			},
			{
				name: 'content-management',
				req_sess_info : false,
				display_spec:{widget: 'upload',templates:['main'],css:['upload_dialog']},
				custom:{

				},
			}
		],
		role_map : {
			teacher : [
				{
					name : 'av-test',
					perms : [
						'audio.mute:*',
						'audio.unmute:*',
					]
				},
			],
			student : [
				{
					name : 'av-test',
					perms : [
						'audio.mute:*',
						'audio.unmute:*'
					]
				},
			],
			observer : {
			}
		},
		attendees : {
			max : 10,
			listed : [
				{
					name : 'Avinash Bhatia',
					role : 'teacher',
					auth : {
						via : 'noauth' /* noauth, wiziq, local, google+, facebook or other SSOs */
					}
				}
			],
		}
	};


	callback (null, session_config);
}

module.exports = controller;
