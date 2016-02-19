var $      	= require('jquery-deferred');
var aws         = require('aws-sdk');

var s3_communication = {};

var AWS_ACCESS_KEY;
var AWS_SECRET_KEY;
var S3_BUCKET;
var KEY_NAME;
var CONTENT_URL;
var EXPIRE_TIMESTAMP;
var log;
s3_communication.init = function(startupInfo,logs){
	log = logs;
	AWS_ACCESS_KEY = startupInfo.custom.s3_access_key;
	AWS_SECRET_KEY = startupInfo.custom.s3_secret_key;	
	S3_BUCKET = startupInfo.custom.bucket_name;
	CONTENT_URL = startupInfo.custom.s3_content_url;
	KEY_NAME = startupInfo.custom.s3_key_name;
	EXPIRE_TIMESTAMP = startupInfo.custom.sessionduration;
};
/* Method used to get the pre_signed url which will expire after given time.
*  @parameter : information of file to upload*/
s3_communication.get_presigned_url = function(info){
	var _d = $.Deferred();
	aws.config.update({accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_SECRET_KEY});
	var s3 = new aws.S3();
	var s3_params = {
		Bucket: S3_BUCKET,
		Key: KEY_NAME+'/'+info.file_name,
		Expires: EXPIRE_TIMESTAMP,
		ContentType: info.file_type,
		ACL: 'public-read'
	};
	s3.getSignedUrl('putObject', s3_params, function(err, data){
		if(err){
			_d.reject('Error pre-signed url, '+err);
		}
		else{
			var return_data =
				{
					signed_request: data,
					url: CONTENT_URL+info.file_name,
					file_name: info.file_name
				};
				_d.resolve(return_data);
		}
	});
	return _d.promise();
};

module.exports = s3_communication;


