/* 
 * content upload
 * 
 */

define(function(require){
	var $ 			= require('jquery');
	var framework		= require('framework');
	var upload_handler	= require('./uploadHandler');
	var content_store	= require('./content-store');
	var upload = {};
	upload.init = function( display_spec, custom, perms){
		var _d = $.Deferred();
		return _d.promise();
	};

	upload.start = function( info, class_info){
		$('#nav-upload').click(uploadClickHandler);
		
	};
	
	upload.info = function (from, id, data) {
		upload_handler.info(from,id,data);
	};	

	function uploadClickHandler(){
		//content_store.init();
		upload_handler.load();
	}
	

	return upload;
});
