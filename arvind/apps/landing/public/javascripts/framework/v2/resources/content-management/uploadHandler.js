/*
 *	this is the changed file
 *
 */


define(function(require){
	var $                   = require('jquery');
	var framework           = require('framework');
	var remodal 		= require('remodal');
	var events    		= require('events');
	var f_handle 		= framework.handle ('content-management');
	var upload_handler = {};
	var remodalinst;
	var file;
	var upload_ev   = events.emitter ('contentupload', 'uploadHandler');
	var start_time;
	var end_time;
	var upload_info = {}; /* Object holds the uploaded content information */ 
	upload_handler.load = function(){
		console.log('Identity: ',f_handle.identity);
		var options = {
			closeOnConfirm : false
		};
		remodalinst = $('[data-remodal-id=upload]').remodal(options);
		remodalinst.open();
	};

	/**
	 *	Method called when user select any file to upload.
	 */
	$('#uploadFile').change(function(){
		file = this.files[0];
		if(file.size > 8484288){
			console.log('File is too big!');			
		}	
	});
	/**
	 *	Method called when user enter publically shared url.
	 */
	$('#urlInput').keypress(function(e){		
		if(e.keyCode == 13 ){
			if($('#urlInput').val() === ""){
				alert('Please add content url, and press enter key.');
			}else{
				var d = new Date();
				end_time = d.getTime();
				console.log('Content From url:<---> ', $('#urlInput').val() );
				var info = {
					vc_id 		: f_handle.identity.vc_id,
					u_name 		: f_handle.identity.id,
					content_url 	: $('#urlInput').val(),
					file_name       : d.getTime()+"_"+ get_name($('#urlInput').val()),
					file_org_name   : get_name($('#urlInput').val())
				};
				console.log('======: ', info);
				f_handle.send_info (null, 'content_conversion',info);
				remodalinst.close();
				//f_handle.send_command('*','content_upload',$('#urlInput').val());
			}
		}	
	});
	/**
	 *	Method called when user select file to upload and press upload button.
	 */ 
	$('#uploadBtn').click(function(){
		if(file === null){
			alert('Please select file to upload');
		}else{
			var d = new Date();
			var file_name = d.getTime()+"_"+file.name;
			store_upload_info(file_name,file);
			var data=  {
				file_name: file_name,
				file_type: file.type
			};
			f_handle.send_info (null, 'content_upload', data);
		}
		remodalinst.close();
		console.log("Upload click. fileName:--> " + file.name,"size : " + file.size ,"type : " + file.type);
	});

	upload_handler.info = function (from, id, data) {
		var d = new Date(); 
		start_time = d.getTime();
		if(id === 'content_conversion'){
			var conversion_time  = (start_time - end_time)/1000;
			console.log('Converted content:<-++++++-> ', data.content_id,' Time Taken: ',conversion_time);
			upload_ev.emit ('success',data);
		}else{
			console.log('content at client side:<> ', data.file_name,' ID: ', id);
			upload_file(data);
		}
	};
	/*
	 *	Method used to store uploaded content information.
	 */ 
	function store_upload_info(file_name, file){
		upload_info[file_name] =  {
			file:file
		};
	}
	/*
	 *	Method used to upload file to s3 temporary storage.
	 */ 
	function upload_file(data){
		var file_obj = upload_info[data.file_name].file;
		console.log('UploadFile: ', data.signed_request,' URL: ',data.url,'F_name: ', data.file_name,'OrgFileName: ',file_obj.name);
		var xhr = new XMLHttpRequest();
		xhr.open("PUT", data.signed_request);
		xhr.setRequestHeader('x-amz-acl', 'public-read');
		xhr.upload.addEventListener("progress", update_progress);
		xhr.onload = function() {
			upload_success(xhr.status,data.url,file_obj.name,data.file_name);
		};
		xhr.onerror = function() {
			alert("Could not upload file.");
		};
		xhr.send(file);
	}
	/* Method called when progress event of upload dispatched.*/
	function update_progress(evt){
		if(evt.lengthComputable === true){
			var percentage_upload = (evt.loaded/evt.total)*100;
			console.log('Content progress: ',percentage_upload, ' Loaded: ',evt.loaded,' Total: ',evt.total );
		}
	}
	/* Method called when content has been uploaded successfully to temporary storage
	 *	Also send information to culter to send it further for conversion.
	 */
	function upload_success(status_code, doc_url,file_org_name,file_name){
		switch(status_code){
			case 200:
				var d = new Date();
				end_time = d.getTime();
				var total_time = (end_time - start_time)/1000;
				console.log('uploaded document url:<-> ', doc_url, 'Total upload time: ',total_time,'F_NAME: ', file_name);
				var info = {
					vc_id 		: f_handle.identity.vc_id,
					u_name 		: f_handle.identity.id,
					content_url 	: doc_url,
					file_name 	: file_name,
					file_org_name	: file_org_name
				};
				f_handle.send_info (null, 'content_conversion',info);
				break;
			case 401:
			case 403:
				alert('Permission issue ', status_code);
				break;
		}

	}
	/*Method used to extract file name from the public url*/
	function get_name(url){
		var str = url.substring((url.lastIndexOf('/') +1),url.length);
		return str;
	}
	return upload_handler;

});
