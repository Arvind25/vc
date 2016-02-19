define(function(require) {
	var $            = require('jquery');
	var log          = require('log')('av-container-pool', 'info');
	var av_container = require('./container');

	var pool = {};
	var anchor;
	var free_video = {}, free_screenshare = {}, used = {};

	pool.init = function (f_handle, display_spec, custom, perms) {
		anchor = display_spec.anchor;
		probe (anchor);
		return true;
	};

	pool.alloc_container = function (type, mode, meta_info) {
		var __pool = free_video;

		if (type === 'screenshare-local' || type === 'screenshare-remote')
			__pool = free_screenshare;

		var c = Object.keys (__pool);

		if (!c.length) {
			log.error ('no free containers left');
			return null;
		}

		/* Take the first available container */
		var container = __pool[c[0]];

		container.set_type (type);
		container.set_mode (mode);
		container.set_meta (meta_info);
		container.change_state ('connected');

		used[c[0]] = container;
		delete __pool[c[0]];

		log.info ('allocated container #' + c[0] + ', type (' + type + '), mode (' + mode + ')');

		return container;
	};

	pool.giveup_container = function (container) {
		var __pool = free_video;
		var id = container.id();
		var type = container.get_type();

		if (!used[id]) {
			log.error ('attempt to giveup non-used container (id = #' + id + ')');
			return;
		}

		if (type === 'screenshare-local' || type === 'screenshare-remote')
			__pool = free_screenshare;


		__pool[id] = container;
		delete used[id];

		container.giveup ();
	};

	pool.get_containers_by_mode = function (mode) {
		var arr = [];

		for (var c in used) {
			var container = used[c];

			if (container.get_mode () == mode)
				arr.push(container);
		}

		return arr;
	};

	pool.free_count = function (type) {
		var __pool = free_video;

		if (type === 'screenshare')
			__pool = free_screenshare;

		return Object.keys(__pool).length;
	};

	pool.get_container_by_id = function (pool, id) {
		if (pool != 'used' && 'pool' !== 'available')
			throw 'pool.get_container_by_id: invalid argument (pool = ' + pool + ')';

		if (pool === 'used')
			return used[id];

		if (free_video[id])
			return free_video[id];

		return free_screenshare[id];
	};

	pool.get_used_list = function () {
		var arr = [];
		for (var c in used)
			arr.push(used[c]);
		return arr;
	};

	function probe (anchor) {

		$.each( $('#av-containers .av-container'), function (index, div) {
			var id = $(div).attr('id');
			var __pool = free_video;

			/* We want to allocate and reserve exactly one container for screenshare */
			if (!Object.keys(free_screenshare).length)
				__pool = free_screenshare;

			__pool[id] = new av_container(div);

			log.info ('probe_layout: adding container "#' + id + '" to av pool');
		});
	}

	return pool;
});
