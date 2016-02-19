define(function(require) {
	var $           = require('jquery');
	window.jade     = require('jade');
	var jquery_drag = require('jquery_drag');
	var log         = require('log')('wboard-basic', 'info');
	var framework   = require('framework');

	var wboard = {};
	var f_handle = framework.handle ('wboard-basic');
	var canvas;
	var canvas_parent;

	wboard.init = function (display_spec, custom, perms) {
		var _d = $.Deferred();

		var anchor = display_spec.anchor;
		var template = f_handle.template('default');

		if (!template) {
			_d.reject ('wboard-basic: template not found');
			return _d.promise ();
		}

		$(anchor).append(template({title: 'Black Board - Basic'}));
		canvas = $(anchor).find('canvas')[0];
		canvas_parent = $(canvas).parent();

		_d.resolve();
		return _d.promise();
	};

	var ctx;

	wboard.start = function (sess_info) {
		log.info ('My Stuff = ', sess_info);

		$(function() {
			ctx = $(canvas)[0].getContext("2d");
			$(canvas).on('drag dragstart dragend', function(e) {
				offset = $(this).offset();
				data = {
					x: (e.clientX - offset.left),
					y: (e.clientY - offset.top),
					type: e.handleObj.type
				};
				draw(data);
				f_handle.send_info (null, 'draw', data);
			});
		});
	};

	wboard.info = function (from, id, data) {
		if (id !== 'draw') {
			log.error ('bad info_id: \"' + id + '\"');
			return;
		}
		draw (data);
	};

	function draw (data) {

		if (data.type == "dragstart") {
			ctx.beginPath();
			ctx.moveTo(data.x,data.y);
		} else if (data.type == "drag") {
			ctx.lineTo(data.x,data.y);
			ctx.stroke();
		} else {
			ctx.stroke();
			ctx.closePath();
		}
	}

	return wboard;
});
