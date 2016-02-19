var $ 		= require('jquery-deferred');
var conversion 	= require('./conversion');
var file_manager= require('./file-management');
var log;
var coms;
var content = {};
content.init = function (myinfo, common, handles) {
	var _d = $.Deferred ();

	log = handles.log;
	coms = handles.coms;
	log.info ('Content management: init :',JSON.stringify(myinfo));
	conversion.init(myinfo, log);
	file_manager.init(myinfo, log);
	_d.resolve ();
	return _d.promise ();
};

content.init_user = function (user) {
	log.info ('Content basics: init :', myinfo); conversion.init(myinfo, log);
	var _d = $.Deferred ();

	_d.resolve ({
		background : 'white'
	});

	return _d.promise ();
};

content.info = function (from, id, info) {
	log.info('Content management upload :ID--->: ',id,' Info:-> ',info,' From: ',from);
	if(id === 'content_upload'){
		get_presigned_url(info);
	}else if(id === 'content_conversion'){
		send_file_to_conversion(info);
	}
	else{
		coms.broadcast_info (id, info, from);
	}
};
/* Method called from client to get the temporary url to upload file.*/
function get_presigned_url(info){
	file_manager.get_presigned_url(info)
	.then(
		request_resolved_handler,
		request_failure_handler
	);
}
/* Method used to send file to box conversion*/
function send_file_to_conversion(info){
	conversion.start(info)
	.then(
		request_resolved_handler,
		request_failure_handler
	);
}

/***/
function request_resolved_handler(val){
	if(val.signed_request !== undefined){
		log.info('Content management content_upload:-> ',JSON.stringify(val));
		coms.broadcast_info ('content_upload', val, 'arvind');
	}else{
		log.info('Content management after conversion conversion:-> ', val);
		coms.broadcast_info ('content_conversion', val, 'arvind');
	}
}
/****/
function request_failure_handler(val){
	coms.broadcast_info ('content_upload', val, 'arvind');
	log.error('Content upload :'+val);
}
module.exports = content;
