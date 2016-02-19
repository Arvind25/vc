var mongodb = require('mongodb');
var mongoose = require('mongoose');

function create_schema (class_id_unique) {
	var Schema = mongoose.Schema;

	var schema = new Schema ({
			class_id : { type : String, unique : (class_id_unique === true ? true : false) },
			time_spec : {
				starts : Date,
				duration : Number
			},
			sched : {
				job_id : String
			}
		});

	return schema;
}

module.exports = create_schema;
