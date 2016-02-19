var $        		= require('jquery-deferred');
var rest 		= require('restler');
var view_api;
var api_token;	
var content_info 	= {};
var log;
var conversion = {};
conversion.init = function(startupInfo,logs){
	view_api = startupInfo.custom.view_api;
	api_token = startupInfo.custom.api_token;
	log = logs;
};
/*Method used to start the conversion process using box api */
conversion.start = function(info){
	var _df = $.Deferred();
	var d = new Date();
	var start_time = d.getTime();
	store_contentinfo(info,start_time);
	conversion_start(info.content_url,info.file_name)
	.then(
		conversion_success.bind(_df),
		conversion_failure.bind(_df),
		conversion_inprogress.bind(_df)
	);
	return _df.promise();
};
/*Method call to initiate the conversion process.*/
function conversion_start(file_url, file_name)
{
	var _d = $.Deferred();
	rest.post(view_api+'documents',{
		headers :{Authorization: api_token, 'Content-Type':'application/json'},
		data    :JSON.stringify( { url	: file_url, name : file_name })

	}).on('complete',function(data){
		log.info('conversion star ID:->  ', data.id," status: ", data.status, ' file_name: ',data.name);
		if(data.id !== undefined){
			if(data.status === 'done'){
				_d.resolve(data);
			}else if(data.status === 'error'){
				_d.reject('Box api conversion error.');
			}else{
				_d.notify(data);
			}
		}else{
			_d.reject('Box api conversion error.');
		}	
	});
	return _d.promise();
}
/* When conversion is in processing state, we again call api method to get status of conversion.*/
function getstatus_ontimeinterval(id){
	get_conversion_status(id)
	.then(
		conversion_success.bind(this),
		conversion_failure.bind(this),
		conversion_inprogress.bind(this)
	);
}
/* Method called when content is in progress state.*/
function conversion_inprogress(data){
	if(content_info[data.name] !== undefined){
		content_info[data.name].content_id = data.id;
		content_info[data.name].content_status = data.status;
		content_info[data.name].interval_id = setTimeout(getstatus_ontimeinterval.bind(this),5000,data.id);
	}
}

/* Method called after specific time interval to get the status to conversion*/
function get_conversion_status(docID)
{
	var _d = $.Deferred();
	rest.get(view_api+'documents/'+docID,{
		headers :{Authorization: api_token, 'Content-Type':'application/json'},
	}).on('complete', function(data){
		log.info('Conversion Status: ',data.id,' Status: ',data.status,' name: ',data.name);
		if(data.id !== undefined){
			if(data.status === 'done'){
				_d.resolve(data);
			}else if(data.status === 'error'){
				_d.reject(data);
			}				
			else{
				_d.notify(data);
			}				
		}
		else{
			_d.reject('Failure to get document status.');
		}
	});
	return _d.promise();
}
/*Method called on successfull conversion*/
function conversion_success(val)
{
	var d = new Date();
	var end_time = d.getTime();
	if(val.id !== undefined){
		if(content_info[val.name] !== undefined){
			var total_time = (end_time - content_info[val.name].start_time)/1000;
			clearInterval(content_info[val.name].interval_id);
			content_info[val.name].content_id = val.id;
			content_info[val.name].content_status = val.status;
			content_info[val.name].total_time = total_time;
		}
		delete content_info[val.name].start_time;
		delete content_info[val.name].interval_id;
		var create_final_object =  content_info[val.name];
		delete content_info[val.name];
		this.resolve(create_final_object);
	}

}
/* Method will called when conversion failed.*/
function conversion_failure(val)
{
	this.reject(val);
}

/* Store content related information in object which will send when conversion complete.*/
function store_contentinfo(info,start_time){
	var data = {
		vc_id 		: info.vc_id,
		u_name		: info.u_name,
		content_url	: info.content_url,
		file_name 	: info.file_name,
		file_org_name 	: info.file_org_name,
		start_time	: start_time
	};
	content_info[info.file_name] = data;
}
module.exports= conversion;
