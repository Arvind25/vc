define(function(require) {
	var $           = require('jquery');
	window.jade     = require('jade');
	var modernizer  = require('modernizer');
	var jquery_drag = require('jquery_drag');
	var jquerypp    = require('jquerypp');
	var jqbookblk   = require('bookblock');
	var log         = require('log')('flipboard-v1', 'info');
	var framework   = require('framework');

	var flipboard = {};
	var f_handle = framework.handle ('flipboard-v1');
	var canvas;

	flipboard.init = function (display_spec, custom, perms) {
		var _d = $.Deferred();

		var anchor = display_spec.anchor;
		var template = f_handle.template('v1');

		if (!template) {
			_d.reject ('flipboard-basic: template not found');
			return _d.promise ();
		}

		$(anchor).append(template({title: 'Flipboard'}));

		var page = Page();
		page.init ();

		canvas = $(anchor).find('canvas')[0];

		_d.resolve();
		return _d.promise();
	};

	var ctx;

	flipboard.start = function (sess_info) {

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

	flipboard.info = function (from, id, data) {
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

	function Page () {

		var config = {
			$bookBlock : $( '#bb-bookblock' ),
			$navNext : $( '#bb-nav-next' ),
			$navPrev : $( '#bb-nav-prev' ),
			$navFirst : $( '#bb-nav-first' ),
			$navLast : $( '#bb-nav-last' )
		},
		init = function() {
			config.$bookBlock.bookblock( {
				orientation: 'horizontal',
				speed : 700,
				shadowSides : 0.8,
				shadowFlip : 0.7
			} );
			initEvents();
		},
		initEvents = function() {

			var $slides = config.$bookBlock.children();

			// add navigation events
			config.$navNext.on( 'click touchstart', function() {
				config.$bookBlock.bookblock( 'next' );
				return false;
			} );

			config.$navPrev.on( 'click touchstart', function() {
				config.$bookBlock.bookblock( 'prev' );
				return false;
			} );

			config.$navFirst.on( 'click touchstart', function() {
				config.$bookBlock.bookblock( 'first' );
				return false;
			} );

			config.$navLast.on( 'click touchstart', function() {
				config.$bookBlock.bookblock( 'last' );
				return false;
			} );

			// add swipe events
			$slides.on( {
				'swipeleft' : function( event ) {
					config.$bookBlock.bookblock( 'next' );
					return false;
				},
				'swiperight' : function( event ) {
					config.$bookBlock.bookblock( 'prev' );
					return false;
				}
			} );

			// add keyboard events
			$( document ).keydown( function(e) {
				var keyCode = e.keyCode || e.which,
					arrow = {
					left : 37,
					up : 38,
					right : 39,
					down : 40
				};

				switch (keyCode) {
					case arrow.left:
						config.$bookBlock.bookblock( 'prev' );
					break;
					case arrow.right:
						config.$bookBlock.bookblock( 'next' );
					break;
				}
			} );
		};

		return { init : init };
	}

	return flipboard;

});
