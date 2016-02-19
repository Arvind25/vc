define(function(require) {
	var $ = require('jquery');
	var log = require('log')('widget-tabs', 'info');

	var tabs = {};
	var tab_count = 0;
	var attached = [];

	tabs.attach = function (anchor, _module) {

		attached.push(_module);
		var module_anchor = create_new_tab (tab_count, 'whiteboard', (tab_count ? false:true));
		_module.resource.display_spec.anchor = module_anchor;

		/*
		 * TODO:
		 * 	If the _module has a template, then attach it under the anchor
		 */

		log.info('tabs.attach ok for ' + _module.name);
		return null;
	};

	function create_new_tab (_id, title, active) {
		var li = 	'<li role="presentation" ' + (active? 'class="active"':'') + '>' +
						'<a href="#tab-' + _id + ' "aria-controls="tab-' + _id + '" role="tab" data-toggle="tab"> ' + title + ' </a>' +
					'</li>';
		var div = 	'<div id="tab-' + _id + '" class="tab-pane fade ' + (active? ' in active ': '') + '" role="tabpanel">' +
					'</div>';

		$('#widget-tabs .tab-inner ul.nav.nav-tabs').append(li);
		$('#widget-tabs .tab-inner .tab-content').append(div);

		return $('#widget-tabs .tab-inner .tab-content div#tab-' + _id);
	}

	return tabs;
});

